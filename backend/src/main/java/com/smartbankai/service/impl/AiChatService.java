package com.smartbankai.service.impl;

import com.smartbankai.dto.Dtos.AiChatMessage;
import com.smartbankai.dto.Dtos.AiChatRequest;
import com.smartbankai.dto.Dtos.AiChatResponse;
import com.smartbankai.entity.*;
import com.smartbankai.repository.*;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class AiChatService {
    private final ObjectProvider<ChatModel> chatModelProvider;
    private final AccountRepository accounts;
    private final KYCApplicationRepository kycApplications;
    private final TransactionRepository transactions;
    private final FraudAlertRepository fraudAlerts;
    private final LoanApplicationRepository loans;

    @Value("${spring.ai.google.genai.chat.options.model:gemini-2.5-flash-lite}")
    private String model;

    public AiChatService(ObjectProvider<ChatModel> chatModelProvider, AccountRepository accounts, KYCApplicationRepository kycApplications, TransactionRepository transactions, FraudAlertRepository fraudAlerts, LoanApplicationRepository loans) {
        this.chatModelProvider = chatModelProvider;
        this.accounts = accounts;
        this.kycApplications = kycApplications;
        this.transactions = transactions;
        this.fraudAlerts = fraudAlerts;
        this.loans = loans;
    }

    public AiChatResponse chat(User user, AiChatRequest request) {
        try {
            ChatModel chatModel = chatModelProvider.getIfAvailable();
            if (chatModel == null) {
                return new AiChatResponse("AI assistant is not configured. Add AI_CHAT_MODEL=google-genai and GEMINI_API_KEY in backend run configuration, then restart backend.");
            }
            GoogleGenAiChatOptions options = GoogleGenAiChatOptions.builder()
                    .model(model)
                    .temperature(0.7)
                    .maxOutputTokens(500)
                    .build();
            ChatResponse response = chatModel.call(new Prompt(buildPrompt(user, request), options));
            String text = response.getResult().getOutput().getText();
            if (text == null || text.isBlank()) return new AiChatResponse("I did not get a clear Gemini response. Please ask again.");
            return new AiChatResponse(text);
        } catch (Exception ex) {
            String message = ex.getMessage() == null ? "" : ex.getMessage();
            if (message.contains("RESOURCE_EXHAUSTED") || message.contains("429") || message.toLowerCase().contains("quota")) {
                return new AiChatResponse("Gemini API quota is exhausted for this key/model. Enable billing or use another Gemini API key with available quota, then restart backend.");
            }
            if (message.contains("API_KEY") || message.contains("403") || message.toLowerCase().contains("permission")) {
                return new AiChatResponse("Gemini API key/access is not valid. Check GEMINI_API_KEY and Google AI Studio project permissions, then restart backend.");
            }
            return new AiChatResponse("AI assistant could not respond right now. Check backend terminal for Gemini/Spring AI configuration.");
        }
    }

    private String buildPrompt(User user, AiChatRequest request) {
        boolean admin = user.getRoles().stream().anyMatch(role -> role.getName() == RoleName.ROLE_ADMIN);
        Account account = accounts.findByUser(user).orElse(null);
        String kycStatus = kycApplications.findByUser(user).map(k -> k.getStatus().name()).orElse(KycStatus.NOT_SUBMITTED.name());
        long txCount = transactions.countByUser(user);
        long fraudCount = fraudAlerts.countByUser(user);
        String loanStatus = loans.findByUserOrderByCreatedAtDesc(user).stream().findFirst().map(loan -> loan.getStatus().name()).orElse("NO_LOAN");
        StringBuilder prompt = new StringBuilder();
        prompt.append("""
                You are SmartBank AI Assistant inside a banking project.
                Keep replies simple, practical, and short, but complete enough for the user to follow.
                If the user asks a one-word follow-up like "then", continue the previous answer using recent chat context.
                Do not claim you completed actions. Tell users which page/action to use.
                For banking, security, loans, or fraud, advise users to verify in the app screens.

                SmartBank AI project guide:
                - Login flow: Login page -> enter email/password -> email OTP is sent -> Verify OTP page -> dashboard opens.
                - New customer flow: Register page -> email OTP -> login/verify OTP -> Dashboard shows KYC form -> submit KYC -> wait for admin approval.
                - KYC page/form is shown inside Dashboard when customer is not approved. Required fields: full name, mobile number, address, PAN, Aadhaar.
                - PAN rule: exactly 10 characters, 5 uppercase letters + 4 digits + 1 uppercase letter, example ABCDE1234F.
                - Aadhaar rule: exactly 12 digits, example 123456789012.
                - After KYC is PENDING, customer cannot edit banking pages; they see pending details until admin approves/rejects.
                - After admin approves KYC, system creates savings account with opening balance 0 and unlocks Dashboard, Transactions, Operations, Investments, Loans, Fraud Alerts, AI Assistant.
                - If admin rejects KYC, customer can resubmit KYC with corrected details.
                - Operations page includes Deposit, Withdraw, Transfer, QR Payment, QR download, scan QR from gallery, and scan QR with camera.
                - Description fields are not shown. Backend creates default descriptions: Cash deposit, Cash withdrawal, Account transfer, QR payment.
                - Transactions page shows deposits, withdrawals, transfers, filters, search, amount, category, description, receiver.
                - Dashboard shows balance, income, expenses, transaction count, risk score, charts, recent activity.
                - Fraud testing: create suspicious activity such as withdrawal above Rs 75,000, transfer to a new receiver, or several transactions quickly. Then open Fraud Alerts.
                - Fraud Alerts page shows risk score, alert reasons, risk level, open/resolved state.
                - Investment page: enter income, expenses, goal, risk appetite, duration -> Analyze Risk -> see AI suggestions, allocation sliders, add/remove portfolio, analytics.
                - Loan page: EMI calculator and loan approval prediction. Inputs include credit score, monthly income, existing EMI, loan amount, employment type. History is saved.
                - Admin modules: Analytics, KYC, Fraud, Loans, Customers, Audit Logs.
                - Admin KYC: view pending/approved/rejected, complete KYC details, approve or reject with reason.
                - Admin Customers: search customers, view profile, account details, transaction/fraud/loan history, enable/disable customer, freeze/unfreeze account.
                - Disabled customer cannot login. Frozen account cannot perform banking actions.
                - Admin Fraud: view suspicious activity, reasons, risk score, approve or block open reviews.
                - Admin Loans: view underwriting data and approve/reject loans with reason.
                - Audit Logs: search/filter important admin actions.
                - Admin accounts should not appear in customer management.
                """);
        prompt.append("\nCurrent user context:\n");
        prompt.append("Name: ").append(user.getName()).append("\n");
        prompt.append("Role: ").append(admin ? "ADMIN" : "CUSTOMER").append("\n");
        prompt.append("KYC status: ").append(admin ? "APPROVED" : kycStatus).append("\n");
        prompt.append("Account: ").append(account == null ? "No account" : account.getAccountNumber()).append("\n");
        prompt.append("Account status: ").append(account == null ? "NO_ACCOUNT" : account.getStatus()).append("\n");
        prompt.append("Balance: ").append(account == null ? "0" : account.getBalance()).append("\n");
        prompt.append("Transactions: ").append(txCount).append("\n");
        prompt.append("Fraud alerts: ").append(fraudCount).append("\n");
        prompt.append("Latest loan status: ").append(loanStatus).append("\n\n");
        prompt.append("Recent chat:\n");
        for (AiChatMessage item : safeHistory(request.history())) {
            prompt.append(item.role()).append(": ").append(item.text()).append("\n");
        }
        prompt.append("User: ").append(request.message()).append("\nAssistant:");
        return prompt.toString();
    }

    private List<AiChatMessage> safeHistory(List<AiChatMessage> history) {
        if (history == null) return List.of();
        List<AiChatMessage> safe = new ArrayList<>();
        int start = Math.max(0, history.size() - 8);
        for (int i = start; i < history.size(); i++) {
            AiChatMessage msg = history.get(i);
            if (msg != null && msg.text() != null && msg.text().length() <= 1000) safe.add(msg);
        }
        return safe;
    }
}
