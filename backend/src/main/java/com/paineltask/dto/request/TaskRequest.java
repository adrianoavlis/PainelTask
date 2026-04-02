package com.paineltask.dto.request;

import com.paineltask.model.enums.Priority;
import com.paineltask.model.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TaskRequest {

    @NotBlank(message = "Título é obrigatório")
    @Size(max = 255, message = "Título deve ter no máximo 255 caracteres")
    private String title;

    private String description;

    private TaskStatus status = TaskStatus.TODO;

    private Priority priority = Priority.MEDIUM;

    private LocalDate dueDate;

    @Size(max = 100)
    private String topic;

    @Size(max = 500)
    private String tags;

    private String notes;

    private Long assignedToId;
}
