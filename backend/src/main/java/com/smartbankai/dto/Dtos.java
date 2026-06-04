package com.smartbankai.dto;

import com.smartbankai.entity.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class Dtos {
    public record RegisterRequest(@NotBlank String name, @Email String email, @Size(min = 6) String password, String phone) {}
    public record LoginRequest(@Email String email, @NotBlank String password) {}
    public record VerifyOtpRequest(@Email String email, @NotBlank String otp) {}
    public record AuthResponse(String token, String message, UserProfile profile) {}
    public record UserProfile(Long id, String name, String email, String phone, List<String> roles, String accountNumber, BigDecimal balance, String kycStatus, boolean dashboardUnlocked) {}
    public record KycRequest(
            @NotBlank String fullName,
            @NotBlank String mobileNumber,
            @NotBlank String address,
            @NotBlank @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]$", message = "PAN must be 5 letters, 4 digits, and 1 letter. Example: ABCDE1234F") String panNumber,
            @NotBlank @Pattern(regexp = "^[0-9]{12}$", message = "Aadhaar must be exactly 12 digits. Example: 123456789012") String aadhaarNumber
    ) {}
    public record KycRejectRequest(@NotBlank String reason) {}
    public record AdminRejectRequest(@NotBlank String reason) {}
    public record AiChatRequest(@NotBlank String message, List<AiChatMessage> history) {}
    public record AiChatMessage(String role, String text) {}
    public record AiChatResponse(String reply) {}
    public record MoneyRequest(@NotNull @DecimalMin("1.00") BigDecimal amount) {}
    public record TransferRequest(@NotNull @DecimalMin("1.00") BigDecimal amount, @NotBlank String receiverAccount) {}
    public record QrPaymentRequest(@NotBlank String qrCode, @NotNull @DecimalMin("1.00") BigDecimal amount) {}
    public record QrView(String accountHolder, String qrCode) {}
    public record TransactionView(Long id, TransactionType type, TransactionCategory category, BigDecimal amount, String description, String receiverAccount, LocalDateTime createdAt) {}
    public record DashboardView(BigDecimal balance, BigDecimal income, BigDecimal expenses, long transactions, int riskScore) {}
    public record RiskProfileRequest(@NotNull BigDecimal monthlyIncome, @NotNull BigDecimal monthlyExpenses, @NotBlank String investmentGoal, @NotBlank String riskAppetite, @NotNull Integer investmentDurationYears) {}
    public record PortfolioRequest(@NotBlank String assetName, @NotBlank String assetType, @NotNull BigDecimal investedAmount, @NotNull BigDecimal currentValue) {}
    public record EmiRequest(@NotNull BigDecimal principal, @NotNull BigDecimal annualRate, @NotNull Integer tenureMonths) {}
    public record LoanPredictionRequest(@NotNull Integer creditScore, @NotNull BigDecimal monthlyIncome, @NotNull BigDecimal existingEmi, @NotNull BigDecimal loanAmount, @NotBlank String employmentType) {}
}
