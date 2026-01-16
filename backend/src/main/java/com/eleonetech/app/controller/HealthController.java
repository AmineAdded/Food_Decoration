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

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> apiHealth() {

        Runtime runtime = Runtime.getRuntime();

        long used = runtime.totalMemory() - runtime.freeMemory();
        long total = runtime.totalMemory();
        long max = runtime.maxMemory();

        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "backend-springboot");

        response.put("ram_used_mb", used / (1024 * 1024));
        response.put("ram_total_mb", max / (1024 * 1024)); // 👈 512 MB
        response.put("ram_usage_percent",
                (used * 100) / max);

        response.put("timestamp", Instant.now().toString());

        return ResponseEntity.ok(response);
    }
}
