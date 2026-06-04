package com.smartbankai.service.impl;

import com.smartbankai.dto.Dtos.*;
import com.smartbankai.entity.*;
import com.smartbankai.exception.BadRequestException;
import com.smartbankai.repository.*;
import com.smartbankai.security.CustomUserDetailsService;
import com.smartbankai.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AccountRepository accountRepository;
    private final KYCApplicationRepository kycRepository;
    private final OTPVerificationRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final OtpMailService otpMailService;
    private final SecureRandom secureRandom = new SecureRandom();
    @Value("${app.otp.expiration-minutes}")
    private long otpMinutes;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository, AccountRepository accountRepository, KYCApplicationRepository kycRepository, OTPVerificationRepository otpRepository, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager, JwtService jwtService, CustomUserDetailsService userDetailsService, OtpMailService otpMailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.accountRepository = accountRepository;
        this.kycRepository = kycRepository;
        this.otpRepository = otpRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.otpMailService = otpMailService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) throw new BadRequestException("Email already registered");
        Role role = roleRepository.findByName(RoleName.ROLE_CUSTOMER).orElseGet(() -> roleRepository.save(new Role(RoleName.ROLE_CUSTOMER)));
        User user = new User();
        user.setName(req.name());
        user.setEmail(req.email());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setPhone(req.phone());
        user.setRoles(Set.of(role));
        userRepository.save(user);
        createOtp(user.getEmail());
        return new AuthResponse(null, "Registered. Check your email for the OTP, then submit KYC for admin approval.", profile(user));
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email()).orElseThrow(() -> new BadRequestException("Bad credentials"));
        if (!user.isEnabled()) throw new BadRequestException("Account is disabled. Please contact admin.");
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        createOtp(req.email());
        return new AuthResponse(null, "Password verified. Check your email for the OTP.", null);
    }

    public AuthResponse verifyOtp(VerifyOtpRequest req) {
        OTPVerification otp = otpRepository.findTopByEmailOrderByIdDesc(req.email()).orElseThrow(() -> new BadRequestException("OTP not found"));
        if (otp.isVerified() || otp.getExpiresAt().isBefore(LocalDateTime.now()) || !otp.getOtp().equals(req.otp())) {
            throw new BadRequestException("Invalid or expired OTP");
        }
        otp.setVerified(true);
        otpRepository.save(otp);
        var details = userDetailsService.loadUserByUsername(req.email());
        User user = userRepository.findByEmail(req.email()).orElseThrow();
        if (!user.isEnabled()) throw new BadRequestException("Account is disabled. Please contact admin.");
        return new AuthResponse(jwtService.generateToken(details), "Login successful", profile(user));
    }

    public UserProfile profile(User user) {
        Account account = accountRepository.findByUser(user).orElse(null);
        boolean admin = user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN);
        boolean unlocked = admin || (account != null && KycStatus.APPROVED.name().equals(kycStatus(user)));
        return new UserProfile(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRoles().stream().map(r -> r.getName().name()).toList(),
                account == null ? null : account.getAccountNumber(),
                account == null ? BigDecimal.ZERO : account.getBalance(),
                admin ? KycStatus.APPROVED.name() : kycStatus(user),
                unlocked
        );
    }

    private void createOtp(String email) {
        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        OTPVerification otp = new OTPVerification();
        otp.setEmail(email);
        otp.setOtp(code);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(otpMinutes));
        otpRepository.save(otp);
        otpMailService.sendOtp(email, code, otpMinutes);
    }

    private String kycStatus(User user) {
        return kycRepository.findByUser(user).map(k -> k.getStatus().name()).orElse(KycStatus.NOT_SUBMITTED.name());
    }
}
