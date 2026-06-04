package com.smartbankai.repository;

import com.smartbankai.entity.LoanApplication;
import com.smartbankai.entity.LoanStatus;
import com.smartbankai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {
    List<LoanApplication> findByUserOrderByCreatedAtDesc(User user);
    long countByStatus(LoanStatus status);
}
