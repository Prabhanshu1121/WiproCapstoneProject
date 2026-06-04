package com.smartbankai.repository;

import com.smartbankai.entity.Portfolio;
import com.smartbankai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {
    List<Portfolio> findByUser(User user);
    Optional<Portfolio> findByIdAndUser(Long id, User user);
}
