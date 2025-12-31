package com.eleonetech.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessResponse {
    private Long id;
    private String ref;
    private String nom;
    private Boolean isActive;
    private String createdAt;
    private String updatedAt;
}