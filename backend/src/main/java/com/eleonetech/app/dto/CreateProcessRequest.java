package com.eleonetech.app.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateProcessRequest {
    private String ref;

    @NotBlank(message = "Le nom du process est obligatoire")
    private String nom;
}