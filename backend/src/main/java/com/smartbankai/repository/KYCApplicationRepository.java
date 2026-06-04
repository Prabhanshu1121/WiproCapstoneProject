package com.smartbankai.repository;

import com.smartbankai.entity.KYCApplication;
import com.smartbankai.entity.KycStatus;
import com.smartbankai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface KYCApplicationRepository extends JpaRepository<KYCApplication, Long> {
    Optional<KYCApplication> findByUser(User user);
    List<KYCApplication> findByStatusOrderBySubmittedAtAsc(KycStatus status);
    long countByStatus(KycStatus status);
}
