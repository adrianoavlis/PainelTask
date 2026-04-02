package com.paineltask.repository;

import com.paineltask.model.Task;
import com.paineltask.model.User;
import com.paineltask.model.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByCreatedByOrAssignedTo(User createdBy, User assignedTo);

    List<Task> findByStatus(TaskStatus status);

    @Query("SELECT t FROM Task t WHERE (t.createdBy = :user OR t.assignedTo = :user) AND t.status = :status")
    List<Task> findByUserAndStatus(@Param("user") User user, @Param("status") TaskStatus status);

    @Query("SELECT t FROM Task t WHERE t.dueDate < :today AND t.status != 'DONE'")
    List<Task> findOverdueTasks(@Param("today") LocalDate today);

    @Query("SELECT t FROM Task t WHERE (t.createdBy = :user OR t.assignedTo = :user) AND t.dueDate < :today AND t.status != 'DONE'")
    List<Task> findOverdueTasksByUser(@Param("user") User user, @Param("today") LocalDate today);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.createdBy LEFT JOIN FETCH t.assignedTo")
    List<Task> findAllWithUsers();

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.createdBy LEFT JOIN FETCH t.assignedTo WHERE t.createdBy = :user OR t.assignedTo = :user")
    List<Task> findByUserWithAssociations(@Param("user") User user);

    long countByStatus(TaskStatus status);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.createdBy = :user OR t.assignedTo = :user")
    long countByUser(@Param("user") User user);

    @Query("SELECT COUNT(t) FROM Task t WHERE (t.createdBy = :user OR t.assignedTo = :user) AND t.status = :status")
    long countByUserAndStatus(@Param("user") User user, @Param("status") TaskStatus status);
}
