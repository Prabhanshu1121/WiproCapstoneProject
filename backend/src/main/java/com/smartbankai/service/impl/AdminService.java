package com.smartbankai.service.impl;

import com.smartbankai.entity.*;
import com.smartbankai.exception.BadRequestException;
import com.smartbankai.exception.ResourceNotFoundException;
import com.smartbankai.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {
    private final UserRepository users;
    private final TransactionRepository transactions;
    private final FraudAlertRepository fraudAlerts;
    private final LoanApplicationRepository loans;
    private final InvestmentProfileRepository investments;
    private final KYCApplicationRepository kycApplications;
    private final AccountRepository accounts;
    private final AuditLogRepository auditLogs;

    public AdminService(UserRepository users, TransactionRepository transactions, FraudAlertRepository fraudAlerts, LoanApplicationRepository loans, InvestmentProfileRepository investments, KYCApplicationRepository kycApplications, AccountRepository accounts, AuditLogRepository auditLogs) {
        this.users = users;
        this.transactions = transactions;
        this.fraudAlerts = fraudAlerts;
        this.loans = loans;
        this.investments = investments;
        this.kycApplications = kycApplications;
        this.accounts = accounts;
        this.auditLogs = auditLogs;
    }

    public Map<String, Object> dashboard() {
        List<User> customerUsers = customerUsers();
        BigDecimal activeLoanOutstanding = loans.findAll().stream()
                .filter(loan -> loan.getStatus() == LoanStatus.APPROVED)
                .map(LoanApplication::getLoanAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("totalUsers", customerUsers.size());
        dashboard.put("totalAccounts", accounts.count());
        dashboard.put("totalTransactions", transactions.count());
        dashboard.put("totalTransfers", transactions.countByType(TransactionType.TRANSFER));
        dashboard.put("totalDeposits", transactions.totalDeposits());
        dashboard.put("totalWithdrawals", transactions.totalWithdrawals());
        dashboard.put("fraudAlertsCount", fraudAlerts.count());
        dashboard.put("pendingFraudReviews", fraudAlerts.countByResolvedFalse());
        dashboard.put("loanApplicationsCount", loans.count());
        dashboard.put("approvedLoansCount", loans.countByStatus(LoanStatus.APPROVED));
        dashboard.put("activeLoansCount", loans.countByStatus(LoanStatus.APPROVED));
        dashboard.put("loanOutstanding", activeLoanOutstanding);
        dashboard.put("rejectedLoansCount", loans.countByStatus(LoanStatus.REJECTED));
        dashboard.put("manualReviewLoansCount", loans.countByStatus(LoanStatus.MANUAL_REVIEW));
        dashboard.put("investmentUsersCount", investments.count());
        dashboard.put("pendingKycCount", kycApplications.countByStatus(KycStatus.PENDING));
        dashboard.put("approvedKycCount", kycApplications.countByStatus(KycStatus.APPROVED));
        dashboard.put("rejectedKycCount", kycApplications.countByStatus(KycStatus.REJECTED));
        dashboard.put("totalFrozenFunds", accounts.totalFrozenBalance());
        return dashboard;
    }

    public List<Map<String, Object>> customers() {
        return customerUsers().stream().map(this::customerSummary).toList();
    }

    public Map<String, Object> customer(Long id) {
        User user = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        if (!isCustomer(user)) throw new ResourceNotFoundException("Customer not found");
        Map<String, Object> detail = new LinkedHashMap<>(customerSummary(user));
        detail.put("transactions", transactions.findByUserOrderByCreatedAtDesc(user));
        detail.put("fraudAlerts", fraudAlerts.findByUserOrderByCreatedAtDesc(user));
        detail.put("loans", loans.findByUserOrderByCreatedAtDesc(user));
        return detail;
    }

    public List<AuditLog> auditLogs() {
        return auditLogs.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public User setCustomerEnabled(User actor, Long id, boolean enabled) {
        User user = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        user.setEnabled(enabled);
        User saved = users.save(user);
        log(actor, enabled ? "Customer Enable" : "Customer Disable", "CUSTOMER", saved.getEmail(), null);
        return saved;
    }

    @Transactional
    public Account setAccountFrozen(User actor, Long userId, boolean frozen) {
        User user = users.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        Account account = accounts.findByUser(user).orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        account.setStatus(frozen ? "FROZEN" : "ACTIVE");
        account.setFrozenBalance(frozen ? account.getBalance() : BigDecimal.ZERO);
        Account saved = accounts.save(account);
        log(actor, frozen ? "Account Freeze" : "Account Unfreeze", "CUSTOMER", user.getEmail(), null);
        return saved;
    }

    @Transactional
    public LoanApplication approveLoan(User actor, Long id) {
        LoanApplication loan = loans.findById(id).orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        Account account = accounts.findByUser(loan.getUser()).orElseThrow(() -> new ResourceNotFoundException("Customer account not found"));
        loan.setStatus(LoanStatus.APPROVED);
        account.setBalance(account.getBalance().add(loan.getLoanAmount()));
        accounts.save(account);
        transactions.save(transaction(loan.getUser(), TransactionType.DEPOSIT, TransactionCategory.LOAN, loan.getLoanAmount(), "Loan disbursement", account.getAccountNumber()));
        LoanApplication saved = loans.save(loan);
        log(actor, "Loan Approval", "LOAN", "Approved loan #" + id, null);
        return saved;
    }

    @Transactional
    public LoanApplication rejectLoan(User actor, Long id, String reason) {
        LoanApplication loan = loans.findById(id).orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        loan.setStatus(LoanStatus.REJECTED);
        LoanApplication saved = loans.save(loan);
        log(actor, "Loan Rejection", "LOAN", "Rejected loan #" + id + ": " + reason, null);
        return saved;
    }

    @Transactional
    public FraudAlert approveFraud(User actor, Long id) {
        FraudAlert alert = fraudAlerts.findById(id).orElseThrow(() -> new ResourceNotFoundException("Fraud alert not found"));
        alert.setResolved(true);
        FraudAlert saved = fraudAlerts.save(alert);
        log(actor, "Fraud Approval", "FRAUD", "Approved fraud alert #" + id, null);
        return saved;
    }

    @Transactional
    public FraudAlert blockFraud(User actor, Long id) {
        FraudAlert alert = fraudAlerts.findById(id).orElseThrow(() -> new ResourceNotFoundException("Fraud alert not found"));
        alert.setResolved(true);
        FraudAlert saved = fraudAlerts.save(alert);
        log(actor, "Fraud Blocking", "FRAUD", "Blocked fraud alert #" + id, null);
        return saved;
    }

    public void log(User actor, String action, String module, String description, String ipAddress) {
        AuditLog log = new AuditLog();
        log.setActorUserId(actor == null ? null : actor.getId());
        log.setActorRole("ADMIN");
        log.setAction(action);
        log.setModule(module);
        log.setDescription(description);
        log.setIpAddress(ipAddress);
        auditLogs.save(log);
    }

    private Map<String, Object> customerSummary(User user) {
        Account account = accounts.findByUser(user).orElse(null);
        String kycStatus = kycApplications.findByUser(user).map(k -> k.getStatus().name()).orElse(KycStatus.NOT_SUBMITTED.name());
        String loanStatus = loans.findByUserOrderByCreatedAtDesc(user).stream().findFirst().map(loan -> loan.getStatus().name()).orElse("-");
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", user.getId());
        row.put("username", user.getName());
        row.put("name", user.getName());
        row.put("email", user.getEmail());
        row.put("mobile", user.getPhone());
        row.put("enabled", user.isEnabled());
        row.put("createdAt", user.getCreatedAt());
        row.put("accountNumber", account == null ? null : account.getAccountNumber());
        row.put("accountBalance", account == null ? BigDecimal.ZERO : account.getBalance());
        row.put("frozenBalance", account == null ? BigDecimal.ZERO : account.getFrozenBalance());
        row.put("accountStatus", account == null ? "NO_ACCOUNT" : account.getStatus() == null ? "ACTIVE" : account.getStatus());
        row.put("kycStatus", kycStatus);
        row.put("loanStatus", loanStatus);
        row.put("fraudAlertCount", fraudAlerts.countByUser(user));
        row.put("totalTransactions", transactions.countByUser(user));
        return row;
    }

    private List<User> customerUsers() {
        return users.findAll().stream().filter(this::isCustomer).toList();
    }

    private boolean isCustomer(User user) {
        return user.getRoles().stream().anyMatch(role -> role.getName() == RoleName.ROLE_CUSTOMER)
                && user.getRoles().stream().noneMatch(role -> role.getName() == RoleName.ROLE_ADMIN);
    }

    private Transaction transaction(User user, TransactionType type, TransactionCategory category, BigDecimal amount, String description, String receiver) {
        Transaction tx = new Transaction();
        tx.setUser(user);
        tx.setType(type);
        tx.setCategory(category);
        tx.setAmount(amount);
        tx.setDescription(description);
        tx.setReceiverAccount(receiver);
        tx.setCreatedAt(LocalDateTime.now());
        return tx;
    }
}
