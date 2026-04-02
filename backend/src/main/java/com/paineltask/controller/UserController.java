package com.paineltask.controller;

import com.paineltask.dto.request.CreateCollaboradorRequest;
import com.paineltask.dto.request.UserUpdateRequest;
import com.paineltask.dto.response.ApiResponse;
import com.paineltask.dto.response.UserResponse;
import com.paineltask.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** Lista todos os colaboradores — acessível por todos autenticados */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok(userService.findAll()));
    }

    /** Lista apenas colaboradores ativos — usado no dropdown de tarefas */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<UserResponse>>> findAllActive() {
        return ResponseEntity.ok(ApiResponse.ok(userService.findAllActive()));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> findMe() {
        return ResponseEntity.ok(ApiResponse.ok(userService.findMe()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.findById(id)));
    }

    /** Cria novo colaborador — somente ADMIN */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody CreateCollaboradorRequest request) {
        UserResponse response = userService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    /** Edita colaborador — somente ADMIN */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> update(@PathVariable Long id,
                                                            @Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(userService.update(id, request)));
    }

    /** Desativa colaborador — somente ADMIN */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        userService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.ok("Colaborador desativado com sucesso"));
    }

    /** Reativa colaborador — somente ADMIN */
    @PutMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> activate(@PathVariable Long id) {
        userService.activate(id);
        return ResponseEntity.ok(ApiResponse.ok("Colaborador ativado com sucesso"));
    }
}
