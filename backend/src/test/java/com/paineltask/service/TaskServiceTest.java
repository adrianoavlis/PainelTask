package com.paineltask.service;

import com.paineltask.dto.request.TaskRequest;
import com.paineltask.dto.response.TaskResponse;
import com.paineltask.exception.BusinessException;
import com.paineltask.exception.ResourceNotFoundException;
import com.paineltask.model.Task;
import com.paineltask.model.User;
import com.paineltask.model.enums.Priority;
import com.paineltask.model.enums.Role;
import com.paineltask.model.enums.TaskStatus;
import com.paineltask.repository.TaskRepository;
import com.paineltask.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TaskService taskService;

    private User adminUser;
    private User regularUser;
    private Task task;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .id(1L).name("Admin").email("admin@test.com")
                .password("encoded").role(Role.ADMIN).active(true).build();

        regularUser = User.builder()
                .id(2L).name("User").email("user@test.com")
                .password("encoded").role(Role.USER).active(true).build();

        task = Task.builder()
                .id(1L).title("Test Task")
                .status(TaskStatus.TODO).priority(Priority.MEDIUM)
                .createdBy(regularUser).build();
    }

    private void authenticateAs(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities())
        );
    }

    @Test
    void create_shouldSaveAndReturnTaskResponse() {
        authenticateAs(regularUser);
        TaskRequest request = new TaskRequest();
        request.setTitle("Nova Task");
        request.setStatus(TaskStatus.TODO);
        request.setPriority(Priority.HIGH);

        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId(10L);
            return t;
        });

        TaskResponse response = taskService.create(request);

        assertThat(response.getTitle()).isEqualTo("Nova Task");
        assertThat(response.getPriority()).isEqualTo(Priority.HIGH);
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    void findById_notFound_shouldThrowResourceNotFoundException() {
        authenticateAs(adminUser);
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void findById_userWithoutAccess_shouldThrowBusinessException() {
        authenticateAs(regularUser);
        User otherUser = User.builder().id(3L).name("Other").email("other@test.com")
                .role(Role.USER).active(true).build();
        Task otherTask = Task.builder().id(5L).title("Other task")
                .status(TaskStatus.TODO).priority(Priority.LOW).createdBy(otherUser).build();

        when(taskRepository.findById(5L)).thenReturn(Optional.of(otherTask));

        assertThatThrownBy(() -> taskService.findById(5L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void findAll_asAdmin_shouldReturnAllTasks() {
        authenticateAs(adminUser);
        when(taskRepository.findAll()).thenReturn(List.of(task));

        List<TaskResponse> result = taskService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Test Task");
    }

    @Test
    void updateStatus_shouldPersistNewStatus() {
        authenticateAs(regularUser);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(taskRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        TaskResponse response = taskService.updateStatus(1L, TaskStatus.DONE);

        assertThat(response.getStatus()).isEqualTo(TaskStatus.DONE);
    }

    @Test
    void delete_shouldCallRepositoryDelete() {
        authenticateAs(regularUser);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));

        taskService.delete(1L);

        verify(taskRepository, times(1)).delete(task);
    }
}
