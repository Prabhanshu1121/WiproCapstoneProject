package com.smartbankai.service.impl;

import com.smartbankai.dto.Dtos.KycRequest;
import com.smartbankai.entity.*;
import com.smartbankai.exception.BadRequestException;
import com.smartbankai.exception.ResourceNotFoundException;
import com.smartbankai.repository.AccountRepository;
import com.smartbankai.repository.KYCApplicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class KYCService {
    private final KYCApplicationRepository kycRepository;
    private final AccountRepository accountRepository;

    public KYCService(KYCApplicationRepository kycRepository, AccountRepository accountRepository) {
        this.kycRepository = kycRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public KYCApplication submit(User user, KycRequest req) {
        KYCApplication kyc = kycRepository.findByUser(user).orElseGet(KYCApplication::new);
        if (kyc.getStatus() == KycStatus.APPROVED) {
            throw new BadRequestException("KYC is already approved");
        }
        kyc.setUser(user);
        kyc.setFullName(req.fullName());
        kyc.setMobileNumber(req.mobileNumber());
        kyc.setAddress(req.address());
        kyc.setPanNumber(req.panNumber());
        kyc.setAadhaarNumber(req.aadhaarNumber());
        kyc.setStatus(KycStatus.PENDING);
        kyc.setRemarks("Waiting for admin approval");
        kyc.setSubmittedAt(LocalDateTime.now());
        return kycRepository.save(kyc);
    }

    public KYCApplication mine(User user) {
        return kycRepository.findByUser(user).orElse(null);
    }

    public List<KYCApplication> pending() {
        return kycRepository.findByStatusOrderBySubmittedAtAsc(KycStatus.PENDING);
    }

    public List<KYCApplication> byStatus(KycStatus status) {
        return kycRepository.findByStatusOrderBySubmittedAtAsc(status);
    }

    @Transactional
    public KYCApplication approve(Long id) {
        KYCApplication kyc = kycRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("KYC application not found"));
        kyc.setStatus(KycStatus.APPROVED);
        kyc.setRemarks("Approved by admin");
        kyc.setReviewedAt(LocalDateTime.now());
        if (accountRepository.findByUser(kyc.getUser()).isEmpty()) {
            Account account = new Account();
            account.setUser(kyc.getUser());
            account.setAccountNumber("SB" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            account.setQrCode("SBQR-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
            account.setBalance(BigDecimal.ZERO);
            accountRepository.save(account);
        }
        return kycRepository.save(kyc);
    }

    @Transactional
    public KYCApplication reject(Long id, String reason) {
        KYCApplication kyc = kycRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("KYC application not found"));
        kyc.setStatus(KycStatus.REJECTED);
        kyc.setRemarks(reason);
        kyc.setReviewedAt(LocalDateTime.now());
        return kycRepository.save(kyc);
    }
}
