package com.smartbankai.controller;

import com.smartbankai.dto.Dtos.*;
import com.smartbankai.entity.InvestmentProfile;
import com.smartbankai.entity.Portfolio;
import com.smartbankai.service.impl.InvestmentService;
import com.smartbankai.util.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/investment")
public class InvestmentController {
    private final InvestmentService investmentService;
    private final CurrentUser currentUser;
    public InvestmentController(InvestmentService investmentService, CurrentUser currentUser) {
        this.investmentService = investmentService;
        this.currentUser = currentUser;
    }

    @PostMapping("/risk-profile")
    public InvestmentProfile riskProfile(@Valid @RequestBody RiskProfileRequest req) { return investmentService.saveProfile(currentUser.get(), req); }
    @GetMapping("/risk-profile")
    public InvestmentProfile profile() { return investmentService.profile(currentUser.get()); }
    @GetMapping("/suggestions")
    public Map<String, Object> suggestions() { return investmentService.suggestions(currentUser.get()); }
    @PostMapping("/add-portfolio")
    public Portfolio addPortfolio(@Valid @RequestBody PortfolioRequest req) { return investmentService.addPortfolio(currentUser.get(), req); }
    @DeleteMapping("/portfolio/{id}")
    public void deletePortfolio(@PathVariable Long id) { investmentService.deletePortfolio(currentUser.get(), id); }
    @GetMapping("/portfolio-analytics")
    public Map<String, Object> analytics() { return investmentService.analytics(currentUser.get()); }
}
