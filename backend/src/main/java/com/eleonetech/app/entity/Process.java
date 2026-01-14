package com.eleonetech.app.entity;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "processes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Process {

    @Id
    private String id;

    @Indexed(unique = true, sparse = true)
    private String ref;

    @NotBlank(message = "Le nom du process est obligatoire")
    @Indexed(unique = true)
    private String nom;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private Boolean isActive = true;
}