package com.paineltask.service;

import com.paineltask.dto.request.CreateCollaboradorRequest;
import com.paineltask.dto.request.UserUpdateRequest;
import com.paineltask.dto.response.UserResponse;
import com.paineltask.exception.BusinessException;
import com.paineltask.exception.ResourceNotFoundException;
import com.paineltask.model.User;
import com.paineltask.model.enums.Role;
import com.paineltask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> findAll() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    public List<UserResponse> findAllActive() {
        return userRepository.findAll().stream()
                .filter(User::isActive)
                .map(UserResponse::from)
                .toList();
    }

    public UserResponse create(CreateCollaboradorRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email já cadastrado");
        }
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null ? request.getRole() : Role.USER)
                .build();
        return UserResponse.from(userRepository.save(user));
    }

    public UserResponse findMe() {
        User current = currentUser();
        return UserResponse.from(current);
    }

    public UserResponse findById(Long id) {
        return UserResponse.from(getById(id));
    }

    public UserResponse update(Long id, UserUpdateRequest request) {
        User current = currentUser();
        User target = getById(id);

        if (current.getRole() != Role.ADMIN && !current.getId().equals(id)) {
            throw new BusinessException("Você não tem permissão para editar este usuário");
        }

        if (StringUtils.hasText(request.getName())) {
            target.setName(request.getName());
        }
        if (StringUtils.hasText(request.getPassword())) {
            target.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getRole() != null) {
            target.setRole(request.getRole());
        }

        return UserResponse.from(userRepository.save(target));
    }

    public void deactivate(Long id) {
        User target = getById(id);
        target.setActive(false);
        userRepository.save(target);
    }

    public void activate(Long id) {
        User target = getById(id);
        target.setActive(true);
        userRepository.save(target);
    }

    private User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", id));
    }

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
