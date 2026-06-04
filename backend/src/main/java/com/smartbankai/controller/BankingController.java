package com.smartbankai.controller;

import com.smartbankai.dto.Dtos.*;
import com.smartbankai.service.impl.BankingService;
import com.smartbankai.util.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/banking")
public class BankingController {
    private final BankingService bankingService;
    private final CurrentUser currentUser;
    public BankingController(BankingService bankingService, CurrentUser currentUser) {
        this.bankingService = bankingService;
        this.currentUser = currentUser;
    }

    @GetMapping("/dashboard")
    public DashboardView dashboard() { return bankingService.dashboard(currentUser.get()); }
    @PostMapping("/deposit")
    public TransactionView deposit(@Valid @RequestBody MoneyRequest req) { return bankingService.deposit(currentUser.get(), req); }
    @PostMapping("/withdraw")
    public TransactionView withdraw(@Valid @RequestBody MoneyRequest req) { return bankingService.withdraw(currentUser.get(), req); }
    @PostMapping("/transfer")
    public TransactionView transfer(@Valid @RequestBody TransferRequest req) { return bankingService.transfer(currentUser.get(), req); }
    @GetMapping("/my-qr")
    public QrView myQr() { return bankingService.myQr(currentUser.get()); }
    @PostMapping("/qr-payment")
    public TransactionView qrPayment(@Valid @RequestBody QrPaymentRequest req) { return bankingService.qrPayment(currentUser.get(), req); }
    @GetMapping("/transactions")
    public List<TransactionView> transactions() { return bankingService.transactions(currentUser.get()); }
}
