package com.eleonetech.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessSimpleResponse {
    private String id; // ✅ Changé de Long à String
    private String nom;
}