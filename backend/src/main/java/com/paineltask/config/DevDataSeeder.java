package com.paineltask.config;

import com.paineltask.model.User;
import com.paineltask.model.enums.Role;
import com.paineltask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            userRepository.save(User.builder()
                    .name("Administrador")
                    .email("admin@paineltask.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .build());

            userRepository.save(User.builder()
                    .name("Usuário Teste")
                    .email("user@paineltask.com")
                    .password(passwordEncoder.encode("user123"))
                    .role(Role.USER)
                    .build());
        }
    }
}
