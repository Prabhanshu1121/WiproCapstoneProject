package com.smartbankai.service.impl;

import com.smartbankai.entity.*;
import com.smartbankai.repository.FraudAlertRepository;
import com.smartbankai.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class FraudService {
    private final FraudAlertRepository fraudAlertRepository;
    private final TransactionRepository transactionRepository;
    public FraudService(FraudAlertRepository fraudAlertRepository, TransactionRepository transactionRepository) {
        this.fraudAlertRepository = fraudAlertRepository;
        this.transactionRepository = transactionRepository;
    }

    public void evaluate(User user, Transaction tx) {
        List<String> reasons = new ArrayList<>();
        if (tx.getAmount().compareTo(new BigDecimal("200000")) > 0) reasons.add("Very high amount");
        if (transactionRepository.countByUserAndCreatedAtAfter(user, LocalDateTime.now().minusMinutes(10)) >= 4) reasons.add("Multiple transactions in short time");
        if (tx.getReceiverAccount() != null && !transactionRepository.existsByUserAndReceiverAccountAndIdNot(user, tx.getReceiverAccount(), tx.getId())) reasons.add("New receiver account");
        if (tx.getCategory() == TransactionCategory.OTHER && tx.getAmount().compareTo(new BigDecimal("50000")) > 0) reasons.add("Unusual category and amount");
        if (tx.getType() == TransactionType.WITHDRAW && tx.getAmount().compareTo(new BigDecimal("75000")) > 0) reasons.add("Withdrawal higher than normal behavior");
        if (!reasons.isEmpty()) {
            FraudAlert alert = new FraudAlert();
            alert.setUser(user);
            alert.setTransaction(tx);
            alert.setRiskLevel(reasons.size() >= 3 ? RiskLevel.HIGH : reasons.size() == 2 ? RiskLevel.MEDIUM : RiskLevel.LOW);
            alert.setReason(String.join(", ", reasons));
            fraudAlertRepository.save(alert);
        }
    }

    public List<FraudAlert> alerts(User user) { return fraudAlertRepository.findByUserOrderByCreatedAtDesc(user); }
    public List<FraudAlert> allAlerts() { return fraudAlertRepository.findAll(); }
    public int riskScore(User user) {
        return Math.min(100, fraudAlertRepository.findByUserOrderByCreatedAtDesc(user).stream().mapToInt(a -> a.getRiskLevel() == RiskLevel.HIGH ? 30 : a.getRiskLevel() == RiskLevel.MEDIUM ? 15 : 5).sum());
    }
}
