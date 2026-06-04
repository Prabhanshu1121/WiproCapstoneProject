package com.smartbankai.controller;

import com.smartbankai.service.impl.FraudService;
import com.smartbankai.util.CurrentUser;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/fraud")
public class FraudController {
    private final FraudService fraudService;
    private final CurrentUser currentUser;
    public FraudController(FraudService fraudService, CurrentUser currentUser) {
        this.fraudService = fraudService;
        this.currentUser = currentUser;
    }

    @GetMapping("/alerts")
    public Object alerts() { return fraudService.alerts(currentUser.get()); }
    @GetMapping("/user-risk-score")
    public Map<String, Object> riskScore() { return Map.of("riskScore", fraudService.riskScore(currentUser.get())); }
}
