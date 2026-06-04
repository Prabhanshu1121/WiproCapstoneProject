package com.smartbankai.repository;

import com.smartbankai.entity.InvestmentProfile;
import com.smartbankai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InvestmentProfileRepository extends JpaRepository<InvestmentProfile, Long> {
    Optional<InvestmentProfile> findByUser(User user);
}
