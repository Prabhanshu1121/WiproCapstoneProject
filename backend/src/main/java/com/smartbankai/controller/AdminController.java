package com.smartbankai.controller;

import com.smartbankai.dto.Dtos.KycRejectRequest;
import com.smartbankai.dto.Dtos.AdminRejectRequest;
import com.smartbankai.entity.KycStatus;
import com.smartbankai.repository.*;
import com.smartbankai.service.impl.AdminService;
import com.smartbankai.service.impl.KYCService;
import com.smartbankai.util.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;
    private final UserRepository users;
    private final TransactionRepository transactions;
    private final LoanApplicationRepository loans;
    private final FraudAlertRepository fraudAlerts;
    private final KYCService kycService;
    private final CurrentUser currentUser;

    public AdminController(AdminService adminService, UserRepository users, TransactionRepository transactions, LoanApplicationRepository loans, FraudAlertRepository fraudAlerts, KYCService kycService, CurrentUser currentUser) {
        this.adminService = adminService;
        this.users = users;
        this.transactions = transactions;
        this.loans = loans;
        this.fraudAlerts = fraudAlerts;
        this.kycService = kycService;
        this.currentUser = currentUser;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() { return adminService.dashboard(); }
    @GetMapping("/users")
    public Object users() { return adminService.customers(); }
    @GetMapping("/users/{id}")
    public Object user(@PathVariable Long id) { return adminService.customer(id); }
    @PostMapping("/users/{id}/enable")
    public Object enableUser(@PathVariable Long id) { return adminService.setCustomerEnabled(currentUser.get(), id, true); }
    @PostMapping("/users/{id}/disable")
    public Object disableUser(@PathVariable Long id) { return adminService.setCustomerEnabled(currentUser.get(), id, false); }
    @PostMapping("/users/{id}/freeze-account")
    public Object freezeAccount(@PathVariable Long id) { return adminService.setAccountFrozen(currentUser.get(), id, true); }
    @PostMapping("/users/{id}/unfreeze-account")
    public Object unfreezeAccount(@PathVariable Long id) { return adminService.setAccountFrozen(currentUser.get(), id, false); }
    @GetMapping("/transactions")
    public Object transactions() { return transactions.findAll(); }
    @GetMapping("/loan-applications")
    public Object loans() { return loans.findAll(); }
    @PostMapping("/loan-applications/{id}/approve")
    public Object approveLoan(@PathVariable Long id) { return adminService.approveLoan(currentUser.get(), id); }
    @PostMapping("/loan-applications/{id}/reject")
    public Object rejectLoan(@PathVariable Long id, @Valid @RequestBody AdminRejectRequest request) { return adminService.rejectLoan(currentUser.get(), id, request.reason()); }
    @GetMapping("/fraud-alerts")
    public Object fraudAlerts() { return fraudAlerts.findAll(); }
    @PostMapping("/fraud-alerts/{id}/approve")
    public Object approveFraud(@PathVariable Long id) { return adminService.approveFraud(currentUser.get(), id); }
    @PostMapping("/fraud-alerts/{id}/block")
    public Object blockFraud(@PathVariable Long id) { return adminService.blockFraud(currentUser.get(), id); }
    @GetMapping("/audit-logs")
    public Object auditLogs() { return adminService.auditLogs(); }
    @GetMapping("/kyc/pending")
    public Object pendingKyc() { return kycService.pending(); }
    @GetMapping("/kyc/{status}")
    public Object kycByStatus(@PathVariable String status) { return kycService.byStatus(KycStatus.valueOf(status.toUpperCase())); }
    @PostMapping("/kyc/{id}/approve")
    public Object approveKyc(@PathVariable Long id) {
        Object approved = kycService.approve(id);
        adminService.log(currentUser.get(), "KYC Approval", "KYC", "Approved KYC #" + id, null);
        adminService.log(currentUser.get(), "Account Creation", "KYC", "Created account for approved KYC #" + id, null);
        return approved;
    }
    @PostMapping("/kyc/{id}/reject")
    public Object rejectKyc(@PathVariable Long id, @Valid @RequestBody KycRejectRequest request) {
        Object rejected = kycService.reject(id, request.reason());
        adminService.log(currentUser.get(), "KYC Rejection", "KYC", "Rejected KYC #" + id + ": " + request.reason(), null);
        return rejected;
    }
}
