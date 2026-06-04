package com.smartbankai.config;

import com.smartbankai.entity.*;
import com.smartbankai.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Set;

@Configuration
public class DataSeeder {
    @Bean
    CommandLineRunner seed(RoleRepository roles, UserRepository users, AccountRepository accounts, PasswordEncoder encoder) {
        return args -> {
            Role adminRole = roles.findByName(RoleName.ROLE_ADMIN).orElseGet(() -> roles.save(new Role(RoleName.ROLE_ADMIN)));
            roles.findByName(RoleName.ROLE_CUSTOMER).orElseGet(() -> roles.save(new Role(RoleName.ROLE_CUSTOMER)));
            if (!users.existsByEmail("dwivediprabhanshu17@gmail.com")) {
                User admin = user("Prabhanshu Admin", "dwivediprabhanshu17@gmail.com", "Prabhanshu@9981", "9981258482", encoder, adminRole);
                users.save(admin);
                account(admin, "SBADMIN001", java.math.BigDecimal.ZERO, accounts);
            }
        };
    }

    private User user(String name, String email, String password, String phone, PasswordEncoder encoder, Role role) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(encoder.encode(password));
        user.setPhone(phone);
        user.setEnabled(true);
        user.setRoles(Set.of(role));
        return user;
    }

    private void account(User user, String number, java.math.BigDecimal balance, AccountRepository accounts) {
        Account account = new Account();
        account.setUser(user);
        account.setAccountNumber(number);
        account.setQrCode("SBQR-" + number);
        account.setBalance(balance);
        accounts.save(account);
    }
}
