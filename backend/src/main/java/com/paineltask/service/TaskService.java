package com.paineltask.service;

import com.paineltask.dto.request.TaskRequest;
import com.paineltask.dto.response.TaskResponse;
import com.paineltask.exception.BusinessException;
import com.paineltask.exception.ResourceNotFoundException;
import com.paineltask.model.Task;
import com.paineltask.model.User;
import com.paineltask.model.enums.Role;
import com.paineltask.model.enums.TaskStatus;
import com.paineltask.repository.TaskRepository;
import com.paineltask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public List<TaskResponse> findAll() {
        User current = currentUser();
        List<Task> tasks = current.getRole() == Role.ADMIN
                ? taskRepository.findAll()
                : taskRepository.findByCreatedByOrAssignedTo(current, current);
        return tasks.stream().map(TaskResponse::from).toList();
    }

    public TaskResponse findById(Long id) {
        Task task = getById(id);
        checkAccess(task);
        return TaskResponse.from(task);
    }

    public TaskResponse create(TaskRequest request) {
        User current = currentUser();
        User assignedTo = resolveAssignee(request.getAssignedToId());

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .priority(request.getPriority())
                .dueDate(request.getDueDate())
                .topic(request.getTopic())
                .tags(request.getTags())
                .notes(request.getNotes())
                .assignedTo(assignedTo)
                .createdBy(current)
                .build();

        return TaskResponse.from(taskRepository.save(task));
    }

    public TaskResponse update(Long id, TaskRequest request) {
        Task task = getById(id);
        checkAccess(task);

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getTopic() != null) task.setTopic(request.getTopic());
        if (request.getTags() != null) task.setTags(request.getTags());
        if (request.getNotes() != null) task.setNotes(request.getNotes());
        if (request.getAssignedToId() != null) task.setAssignedTo(resolveAssignee(request.getAssignedToId()));

        return TaskResponse.from(taskRepository.save(task));
    }

    public TaskResponse updateStatus(Long id, TaskStatus status) {
        Task task = getById(id);
        checkAccess(task);
        task.setStatus(status);
        return TaskResponse.from(taskRepository.save(task));
    }

    public void delete(Long id) {
        Task task = getById(id);
        checkAccess(task);
        taskRepository.delete(task);
    }

    private Task getById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task", id));
    }

    private void checkAccess(Task task) {
        User current = currentUser();
        if (current.getRole() == Role.ADMIN) return;
        boolean isOwner = task.getCreatedBy() != null && task.getCreatedBy().getId().equals(current.getId());
        boolean isAssignee = task.getAssignedTo() != null && task.getAssignedTo().getId().equals(current.getId());
        if (!isOwner && !isAssignee) {
            throw new BusinessException("Você não tem acesso a esta task");
        }
    }

    private User resolveAssignee(Long assignedToId) {
        if (assignedToId == null) return null;
        return userRepository.findById(assignedToId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário para atribuição", assignedToId));
    }

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
