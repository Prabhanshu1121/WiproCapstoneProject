package com.smartbankai.service.impl;

import com.smartbankai.dto.Dtos.*;
import com.smartbankai.entity.*;
import com.smartbankai.exception.BadRequestException;
import com.smartbankai.exception.ResourceNotFoundException;
import com.smartbankai.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class BankingService {
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final FraudService fraudService;

    public BankingService(AccountRepository accountRepository, TransactionRepository transactionRepository, FraudService fraudService) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.fraudService = fraudService;
    }

    @Transactional
    public TransactionView deposit(User user, MoneyRequest req) {
        Account account = account(user);
        account.setBalance(account.getBalance().add(req.amount()));
        accountRepository.save(account);
        return view(saveTx(user, TransactionType.DEPOSIT, req.amount(), defaultDescription(TransactionType.DEPOSIT), null));
    }

    @Transactional
    public TransactionView withdraw(User user, MoneyRequest req) {
        Account account = account(user);
        if (account.getBalance().compareTo(req.amount()) < 0) throw new BadRequestException("Insufficient balance");
        account.setBalance(account.getBalance().subtract(req.amount()));
        accountRepository.save(account);
        Transaction tx = saveTx(user, TransactionType.WITHDRAW, req.amount(), defaultDescription(TransactionType.WITHDRAW), null);
        fraudService.evaluate(user, tx);
        return view(tx);
    }

    @Transactional
    public TransactionView transfer(User user, TransferRequest req) {
        Account sender = account(user);
        if (sender.getBalance().compareTo(req.amount()) < 0) throw new BadRequestException("Insufficient balance");
        Account receiver = accountRepository.findByAccountNumber(req.receiverAccount()).orElseThrow(() -> new ResourceNotFoundException("Receiver account not found"));
        if (receiver.getUser().getId().equals(user.getId())) throw new BadRequestException("Cannot transfer to your own account");
        sender.setBalance(sender.getBalance().subtract(req.amount()));
        accountRepository.save(sender);
        receiver.setBalance(receiver.getBalance().add(req.amount()));
        accountRepository.save(receiver);
        Transaction tx = saveTx(user, TransactionType.TRANSFER, req.amount(), defaultDescription(TransactionType.TRANSFER), req.receiverAccount());
        saveTx(receiver.getUser(), TransactionType.DEPOSIT, req.amount(), "Received from " + sender.getAccountNumber(), sender.getAccountNumber());
        fraudService.evaluate(user, tx);
        return view(tx);
    }

    @Transactional
    public TransactionView qrPayment(User user, QrPaymentRequest req) {
        Account sender = account(user);
        if (sender.getBalance().compareTo(req.amount()) < 0) throw new BadRequestException("Insufficient balance");
        Account receiver = accountRepository.findByQrCode(req.qrCode().trim()).orElseThrow(() -> new ResourceNotFoundException("Receiver QR not found"));
        if (receiver.getUser().getId().equals(user.getId())) throw new BadRequestException("Cannot pay your own QR");
        sender.setBalance(sender.getBalance().subtract(req.amount()));
        accountRepository.save(sender);
        receiver.setBalance(receiver.getBalance().add(req.amount()));
        accountRepository.save(receiver);
        Transaction tx = saveTx(user, TransactionType.TRANSFER, req.amount(), defaultDescription(TransactionType.QR_PAYMENT), receiver.getQrCode());
        saveTx(receiver.getUser(), TransactionType.DEPOSIT, req.amount(), "Received by QR payment", sender.getQrCode());
        fraudService.evaluate(user, tx);
        return view(tx);
    }

    @Transactional
    public QrView myQr(User user) {
        Account account = account(user);
        return new QrView(user.getName(), account.getQrCode());
    }

    public List<TransactionView> transactions(User user) {
        return transactionRepository.findByUserOrderByCreatedAtDesc(user).stream().map(this::view).toList();
    }

    public DashboardView dashboard(User user) {
        Account account = account(user);
        List<Transaction> txs = transactionRepository.findByUserOrderByCreatedAtDesc(user);
        BigDecimal income = txs.stream().filter(t -> t.getType() == TransactionType.DEPOSIT).map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal expenses = txs.stream().filter(t -> t.getType() != TransactionType.DEPOSIT).map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new DashboardView(account.getBalance(), income, expenses, txs.size(), fraudService.riskScore(user));
    }

    private Transaction saveTx(User user, TransactionType type, BigDecimal amount, String description, String receiver) {
        Transaction tx = new Transaction();
        tx.setUser(user);
        tx.setType(type);
        tx.setAmount(amount);
        tx.setDescription(description == null ? type.name() : description);
        tx.setReceiverAccount(receiver);
        tx.setCategory(categorize(tx.getDescription(), type, amount));
        return transactionRepository.save(tx);
    }

    private TransactionCategory categorize(String description, TransactionType type, BigDecimal amount) {
        String d = description == null ? "" : description.toLowerCase();
        if (type == TransactionType.TRANSFER || type == TransactionType.QR_PAYMENT) return TransactionCategory.TRANSFER;
        if (d.contains("salary") || d.contains("payroll")) return TransactionCategory.SALARY;
        if (d.contains("food") || d.contains("restaurant") || d.contains("cafe")) return TransactionCategory.FOOD;
        if (d.contains("shop") || d.contains("mall") || d.contains("amazon")) return TransactionCategory.SHOPPING;
        if (d.contains("bill") || d.contains("electric") || d.contains("rent")) return TransactionCategory.BILLS;
        if (d.contains("fund") || d.contains("stock") || d.contains("invest")) return TransactionCategory.INVESTMENT;
        if (d.contains("loan") || d.contains("emi")) return TransactionCategory.LOAN;
        return amount.compareTo(new BigDecimal("100000")) > 0 ? TransactionCategory.INVESTMENT : TransactionCategory.OTHER;
    }

    private String defaultDescription(TransactionType type) {
        return switch (type) {
            case DEPOSIT -> "Cash deposit";
            case WITHDRAW -> "Cash withdrawal";
            case TRANSFER -> "Account transfer";
            case QR_PAYMENT -> "QR payment";
        };
    }

    private Account account(User user) {
        if (!user.isEnabled()) {
            throw new BadRequestException("Account is disabled. Please contact admin.");
        }
        Account account = accountRepository.findByUser(user).orElseThrow(() -> new ResourceNotFoundException("Savings account is locked until admin approves KYC"));
        if ("FROZEN".equalsIgnoreCase(account.getStatus())) {
            throw new BadRequestException("Account is frozen. Banking actions are blocked until admin unfreezes it.");
        }
        if (account.getQrCode() == null || account.getQrCode().isBlank()) {
            account.setQrCode("SBQR-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
            return accountRepository.save(account);
        }
        return account;
    }

    private TransactionView view(Transaction tx) {
        return new TransactionView(tx.getId(), tx.getType(), tx.getCategory(), tx.getAmount(), tx.getDescription(), tx.getReceiverAccount(), tx.getCreatedAt());
    }
}
