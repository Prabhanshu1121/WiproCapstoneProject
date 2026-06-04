package com.smartbankai.controller;

import com.smartbankai.dto.Dtos.*;
import com.smartbankai.entity.LoanApplication;
import com.smartbankai.service.impl.LoanService;
import com.smartbankai.util.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/loan")
public class LoanController {
    private final LoanService loanService;
    private final CurrentUser currentUser;
    public LoanController(LoanService loanService, CurrentUser currentUser) {
        this.loanService = loanService;
        this.currentUser = currentUser;
    }

    @PostMapping("/calculate-emi")
    public Map<String, Object> calculateEmi(@Valid @RequestBody EmiRequest req) { return loanService.calculateEmi(req); }
    @PostMapping("/predict-approval")
    public LoanApplication predict(@Valid @RequestBody LoanPredictionRequest req) { return loanService.predict(currentUser.get(), req); }
    @GetMapping("/credit-analysis")
    public Map<String, Object> creditAnalysis() { return loanService.creditAnalysis(currentUser.get()); }
}
