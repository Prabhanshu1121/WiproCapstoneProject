package com.smartbankai.util;

import com.smartbankai.entity.User;
import com.smartbankai.exception.ResourceNotFoundException;
import com.smartbankai.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
    private final UserRepository userRepository;
    public CurrentUser(UserRepository userRepository) { this.userRepository = userRepository; }
    public User get() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
