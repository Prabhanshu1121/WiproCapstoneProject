package com.smartbankai.controller;

import com.smartbankai.dto.Dtos.*;
import com.smartbankai.service.impl.AuthService;
import com.smartbankai.util.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final CurrentUser currentUser;
    public AuthController(AuthService authService, CurrentUser currentUser) {
        this.authService = authService;
        this.currentUser = currentUser;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) { return authService.register(req); }
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) { return authService.login(req); }
    @PostMapping("/verify-otp")
    public AuthResponse verifyOtp(@Valid @RequestBody VerifyOtpRequest req) { return authService.verifyOtp(req); }
    @GetMapping("/profile")
    public UserProfile profile() { return authService.profile(currentUser.get()); }
}
