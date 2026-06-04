package com.smartbankai.service.impl;

import com.smartbankai.dto.Dtos.*;
import com.smartbankai.entity.*;
import com.smartbankai.exception.ResourceNotFoundException;
import com.smartbankai.repository.InvestmentProfileRepository;
import com.smartbankai.repository.PortfolioRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

@Service
public class InvestmentService {
    private final InvestmentProfileRepository profileRepository;
    private final PortfolioRepository portfolioRepository;
    public InvestmentService(InvestmentProfileRepository profileRepository, PortfolioRepository portfolioRepository) {
        this.profileRepository = profileRepository;
        this.portfolioRepository = portfolioRepository;
    }

    public InvestmentProfile saveProfile(User user, RiskProfileRequest req) {
        InvestmentProfile p = profileRepository.findByUser(user).orElseGet(InvestmentProfile::new);
        p.setUser(user);
        p.setMonthlyIncome(req.monthlyIncome());
        p.setMonthlyExpenses(req.monthlyExpenses());
        p.setInvestmentGoal(req.investmentGoal());
        p.setRiskAppetite(req.riskAppetite());
        p.setInvestmentDurationYears(req.investmentDurationYears());
        p.setRiskType(classify(req));
        return profileRepository.save(p);
    }

    public InvestmentProfile profile(User user) {
        return profileRepository.findByUser(user).orElse(null);
    }

    public Map<String, Object> suggestions(User user) {
        InvestmentProfile profile = profileRepository.findByUser(user).orElse(null);
        RiskType type = profile == null ? RiskType.BALANCED : profile.getRiskType();
        BigDecimal income = profile == null || profile.getMonthlyIncome() == null ? BigDecimal.ZERO : profile.getMonthlyIncome();
        BigDecimal expenses = profile == null || profile.getMonthlyExpenses() == null ? BigDecimal.ZERO : profile.getMonthlyExpenses();
        BigDecimal surplus = income.subtract(expenses).max(BigDecimal.ZERO);
        BigDecimal sip = surplus.multiply(new BigDecimal("0.20")).setScale(0, RoundingMode.HALF_UP);
        List<String> funds = switch (type) {
            case CONSERVATIVE -> List.of("Debt funds", "Fixed deposits", "Liquid funds");
            case BALANCED -> List.of("Hybrid funds", "Nifty index funds", "Balanced advantage funds");
            case AGGRESSIVE -> List.of("Equity mutual funds", "Sector funds", "Small cap funds");
        };
        Map<String, Integer> allocation = switch (type) {
            case CONSERVATIVE -> Map.of("Debt", 60, "Equity", 25, "Cash", 15);
            case BALANCED -> Map.of("Equity", 50, "Debt", 35, "Cash", 15);
            case AGGRESSIVE -> Map.of("Equity", 75, "Debt", 15, "Cash", 10);
        };
        return Map.of(
                "riskType", type,
                "suggestions", funds,
                "allocation", allocation,
                "monthlySurplus", surplus,
                "suggestedSip", sip,
                "savingsRecommendation", "Invest ₹" + sip + " monthly based on your current surplus"
        );
    }

    public Portfolio addPortfolio(User user, PortfolioRequest req) {
        Portfolio p = new Portfolio();
        p.setUser(user);
        p.setAssetName(req.assetName());
        p.setAssetType(req.assetType());
        p.setInvestedAmount(req.investedAmount());
        p.setCurrentValue(req.currentValue());
        return portfolioRepository.save(p);
    }

    public void deletePortfolio(User user, Long id) {
        Portfolio p = portfolioRepository.findByIdAndUser(id, user).orElseThrow(() -> new ResourceNotFoundException("Portfolio asset not found"));
        portfolioRepository.delete(p);
    }

    public Map<String, Object> analytics(User user) {
        List<Portfolio> records = portfolioRepository.findByUser(user);
        BigDecimal invested = records.stream().map(Portfolio::getInvestedAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal current = records.stream().map(Portfolio::getCurrentValue).reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of("records", records, "invested", invested, "currentValue", current, "gainLoss", current.subtract(invested));
    }

    private RiskType classify(RiskProfileRequest req) {
        int score = 0;
        if (req.monthlyIncome().subtract(req.monthlyExpenses()).compareTo(new BigDecimal("30000")) > 0) score++;
        if (req.investmentDurationYears() >= 5) score++;
        if (req.riskAppetite().equalsIgnoreCase("high")) score += 2;
        if (req.riskAppetite().equalsIgnoreCase("low")) score--;
        return score >= 3 ? RiskType.AGGRESSIVE : score <= 0 ? RiskType.CONSERVATIVE : RiskType.BALANCED;
    }
}
