package com.paineltask.service;

import com.paineltask.dto.response.DashboardResponse;
import com.paineltask.model.User;
import com.paineltask.model.enums.Priority;
import com.paineltask.model.enums.Role;
import com.paineltask.model.enums.TaskStatus;
import com.paineltask.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TaskRepository taskRepository;

    public DashboardResponse getSummary() {
        User current = currentUser();
        boolean isAdmin = current.getRole() == Role.ADMIN;

        long total = isAdmin
                ? taskRepository.count()
                : taskRepository.countByUser(current);

        long todo = isAdmin
                ? taskRepository.countByStatus(TaskStatus.TODO)
                : taskRepository.countByUserAndStatus(current, TaskStatus.TODO);

        long doing = isAdmin
                ? taskRepository.countByStatus(TaskStatus.DOING)
                : taskRepository.countByUserAndStatus(current, TaskStatus.DOING);

        long done = isAdmin
                ? taskRepository.countByStatus(TaskStatus.DONE)
                : taskRepository.countByUserAndStatus(current, TaskStatus.DONE);

        long overdue = isAdmin
                ? taskRepository.findOverdueTasks(LocalDate.now()).size()
                : taskRepository.findOverdueTasksByUser(current, LocalDate.now()).size();

        double completionRate = total > 0 ? (double) done / total * 100 : 0;

        return DashboardResponse.builder()
                .totalTasks(total)
                .byStatus(Map.of(
                        "TODO", todo,
                        "DOING", doing,
                        "DONE", done
                ))
                .byPriority(Map.of(
                        "LOW", countByPriority(isAdmin, current, Priority.LOW),
                        "MEDIUM", countByPriority(isAdmin, current, Priority.MEDIUM),
                        "HIGH", countByPriority(isAdmin, current, Priority.HIGH)
                ))
                .overdueTasks(overdue)
                .completionRate(Math.round(completionRate * 10.0) / 10.0)
                .build();
    }

    private long countByPriority(boolean isAdmin, User user, Priority priority) {
        if (isAdmin) {
            return taskRepository.findAll().stream()
                    .filter(t -> t.getPriority() == priority)
                    .count();
        }
        return taskRepository.findByCreatedByOrAssignedTo(user, user).stream()
                .filter(t -> t.getPriority() == priority)
                .count();
    }

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
