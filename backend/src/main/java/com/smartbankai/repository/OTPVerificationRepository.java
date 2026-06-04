package com.smartbankai.repository;

import com.smartbankai.entity.OTPVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OTPVerificationRepository extends JpaRepository<OTPVerification, Long> {
    Optional<OTPVerification> findTopByEmailOrderByIdDesc(String email);
}
