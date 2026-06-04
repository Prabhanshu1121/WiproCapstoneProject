package com.smartbankai.repository;

import com.smartbankai.entity.FraudAlert;
import com.smartbankai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FraudAlertRepository extends JpaRepository<FraudAlert, Long> {
    List<FraudAlert> findByUserOrderByCreatedAtDesc(User user);
    long countByUser(User user);
    long countByResolvedFalse();
}
