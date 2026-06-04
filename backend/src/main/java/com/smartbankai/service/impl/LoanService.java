package com.smartbankai.service.impl;

import com.smartbankai.dto.Dtos.*;
import com.smartbankai.entity.*;
import com.smartbankai.repository.LoanApplicationRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Service
public class LoanService {
    private final LoanApplicationRepository repository;
    public LoanService(LoanApplicationRepository repository) { this.repository = repository; }

    public Map<String, Object> calculateEmi(EmiRequest req) {
        double p = req.principal().doubleValue();
        double r = req.annualRate().doubleValue() / 12 / 100;
        int n = req.tenureMonths();
        double emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        BigDecimal monthlyEmi = BigDecimal.valueOf(emi).setScale(2, RoundingMode.HALF_UP);
        return Map.of("emi", monthlyEmi, "totalPayment", monthlyEmi.multiply(BigDecimal.valueOf(n)), "interest", monthlyEmi.multiply(BigDecimal.valueOf(n)).subtract(req.principal()));
    }

    public LoanApplication predict(User user, LoanPredictionRequest req) {
        int score = 0;
        if (req.creditScore() >= 750) score += 35; else if (req.creditScore() >= 650) score += 20; else score += 5;
        if (req.monthlyIncome().compareTo(new BigDecimal("60000")) >= 0) score += 20;
        if (req.existingEmi().compareTo(req.monthlyIncome().multiply(new BigDecimal("0.35"))) < 0) score += 20;
        if (req.loanAmount().compareTo(req.monthlyIncome().multiply(new BigDecimal("20"))) < 0) score += 15;
        if (req.employmentType().equalsIgnoreCase("salaried")) score += 10;
        LoanApplication app = new LoanApplication();
        app.setUser(user);
        app.setCreditScore(req.creditScore());
        app.setMonthlyIncome(req.monthlyIncome());
        app.setExistingEmi(req.existingEmi());
        app.setLoanAmount(req.loanAmount());
        app.setEmploymentType(req.employmentType());
        app.setApprovalScore(score);
        app.setStatus(score >= 75 ? LoanStatus.APPROVED : score < 45 ? LoanStatus.REJECTED : LoanStatus.MANUAL_REVIEW);
        return repository.save(app);
    }

    public Map<String, Object> creditAnalysis(User user) {
        return Map.of("applications", repository.findByUserOrderByCreatedAtDesc(user), "advice", "Keep EMI below 35% of income and maintain credit score above 750.");
    }
}
