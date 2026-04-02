package com.paineltask.dto.request;

import com.paineltask.model.enums.Role;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserUpdateRequest {

    @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
    private String name;

    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
    private String password;

    private Role role;
}
