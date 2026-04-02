package com.paineltask.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class DashboardResponse {

    private long totalTasks;
    private Map<String, Long> byStatus;
    private Map<String, Long> byPriority;
    private long overdueTasks;
    private double completionRate;
}
