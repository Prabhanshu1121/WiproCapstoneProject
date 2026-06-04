package com.smartbankai.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class OtpMailService {
    private final JavaMailSender mailSender;
    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;
    @Value("${spring.mail.username:}")
    private String fromEmail;

    public OtpMailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtp(String email, String otp, long expiresInMinutes) {
        if (!mailEnabled) {
            System.out.println("SmartBank AI mail is disabled. Set MAIL_ENABLED=true to send OTP by email.");
            printOtp(email, otp);
            return;
        }
        if (fromEmail == null || fromEmail.isBlank()) {
            System.out.println("SmartBank AI mail username is missing. Set MAIL_USERNAME to your Gmail address.");
            printOtp(email, otp);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject("SmartBank AI login OTP");
            message.setText("Your SmartBank AI OTP is " + otp + ". It expires in " + expiresInMinutes + " minutes.");
            mailSender.send(message);
            System.out.println("SmartBank AI OTP sent by email to " + email);
        } catch (Exception ex) {
            System.out.println("SmartBank AI email failed for " + email + ". Reason: " + ex.getMessage());
            System.out.println("SmartBank AI fallback OTP for " + email + ": " + otp);
        }
    }

    private void printOtp(String email, String otp) {
        System.out.println("SmartBank AI OTP for " + email + ": " + otp);
    }
}
