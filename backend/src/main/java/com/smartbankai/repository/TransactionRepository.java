package com.smartbankai.repository;

import com.smartbankai.entity.Transaction;
import com.smartbankai.entity.TransactionType;
import com.smartbankai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserOrderByCreatedAtDesc(User user);
    long countByUser(User user);
    long countByUserAndCreatedAtAfter(User user, LocalDateTime since);
    boolean existsByUserAndReceiverAccount(User user, String receiverAccount);
    boolean existsByUserAndReceiverAccountAndIdNot(User user, String receiverAccount, Long id);
    long countByCreatedAtAfter(LocalDateTime since);
    long countByType(TransactionType type);
    @Query("select coalesce(sum(t.amount),0) from Transaction t where t.type = 'DEPOSIT'")
    BigDecimal totalDeposits();
    @Query("select coalesce(sum(t.amount),0) from Transaction t where t.type = 'WITHDRAW'")
    BigDecimal totalWithdrawals();
}
