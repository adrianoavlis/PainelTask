package com.paineltask.controller;

import com.paineltask.dto.request.StatusRequest;
import com.paineltask.dto.request.TaskRequest;
import com.paineltask.dto.response.ApiResponse;
import com.paineltask.dto.response.TaskResponse;
import com.paineltask.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok(taskService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> create(@Valid @RequestBody TaskRequest request) {
        TaskResponse response = taskService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> update(@PathVariable Long id,
                                                             @RequestBody TaskRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.update(id, request)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TaskResponse>> updateStatus(@PathVariable Long id,
                                                                   @Valid @RequestBody StatusRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(taskService.updateStatus(id, request.getStatus())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        taskService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Task removida com sucesso"));
    }
}
