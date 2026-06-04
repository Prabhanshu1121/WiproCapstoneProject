package com.smartbankai.controller;

import com.smartbankai.dto.Dtos.KycRequest;
import com.smartbankai.entity.KYCApplication;
import com.smartbankai.service.impl.KYCService;
import com.smartbankai.util.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/kyc")
public class KYCController {
    private final KYCService kycService;
    private final CurrentUser currentUser;

    public KYCController(KYCService kycService, CurrentUser currentUser) {
        this.kycService = kycService;
        this.currentUser = currentUser;
    }

    @PostMapping("/submit")
    public KYCApplication submit(@Valid @RequestBody KycRequest req) {
        return kycService.submit(currentUser.get(), req);
    }

    @GetMapping("/me")
    public KYCApplication mine() {
        return kycService.mine(currentUser.get());
    }
}
