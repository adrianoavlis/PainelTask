package com.paineltask.dto.request;

import com.paineltask.model.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StatusRequest {

    @NotNull(message = "Status é obrigatório")
    private TaskStatus status;
}
