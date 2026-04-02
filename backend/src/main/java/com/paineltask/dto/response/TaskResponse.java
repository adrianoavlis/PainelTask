package com.paineltask.dto.response;

import com.paineltask.model.Task;
import com.paineltask.model.enums.Priority;
import com.paineltask.model.enums.TaskStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class TaskResponse {

    private Long id;
    private String title;
    private String description;
    private TaskStatus status;
    private Priority priority;
    private LocalDate dueDate;
    private String topic;
    private String tags;
    private String notes;
    private UserResponse assignedTo;
    private UserResponse createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TaskResponse from(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .topic(task.getTopic())
                .tags(task.getTags())
                .notes(task.getNotes())
                .assignedTo(task.getAssignedTo() != null ? UserResponse.from(task.getAssignedTo()) : null)
                .createdBy(task.getCreatedBy() != null ? UserResponse.from(task.getCreatedBy()) : null)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
