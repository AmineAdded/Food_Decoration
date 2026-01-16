package com.eleonetech.app.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.lang.management.RuntimeMXBean;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }

    @GetMapping("/api/health") // Pour UptimeRobot / Render
    public ResponseEntity<Map<String, Object>> apiHealth() {

        Runtime runtime = Runtime.getRuntime();
        RuntimeMXBean runtimeMXBean = ManagementFactory.getRuntimeMXBean();

        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "backend-springboot");

        response.put("memory_used_mb",
                (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024));
        response.put("memory_total_mb",
                runtime.totalMemory() / (1024 * 1024));

        response.put("uptime_ms", runtimeMXBean.getUptime());
        response.put("timestamp", Instant.now().toString());

        return ResponseEntity.ok(response);
    }
}
