package com.smartbankai.repository;

import com.smartbankai.entity.Account;
import com.smartbankai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByUser(User user);
    Optional<Account> findByAccountNumber(String accountNumber);
    Optional<Account> findByQrCode(String qrCode);
    @Query("select coalesce(sum(a.frozenBalance),0) from Account a")
    BigDecimal totalFrozenBalance();
}
