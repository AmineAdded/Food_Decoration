package com.eleonetech.app.controller;

import com.eleonetech.app.dto.AuthResponse;
import com.eleonetech.app.dto.ChangePasswordRequest;
import com.eleonetech.app.dto.MessageResponse;
import com.eleonetech.app.dto.UpdateProfileRequest;
import com.eleonetech.app.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@CrossOrigin(origins = "${cors.allowed-origins}")
@Slf4j
public class UserController {

    private final UserService userService;

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        try {
            String currentEmail = authentication.getName();
            log.info("Update profile request for user: {}", currentEmail);
            log.info("Request data: {}", request);

            AuthResponse response = userService.updateProfile(currentEmail, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error updating profile: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error updating profile: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Une erreur inattendue s'est produite"));
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        try {
            String email = authentication.getName();
            log.info("Change password request for user: {}", email);

            userService.changePassword(email, request);
            return ResponseEntity.ok(new MessageResponse(
                    "Mot de passe modifié avec succès"
            ));
        } catch (RuntimeException e) {
            log.error("Error changing password: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error changing password: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Une erreur inattendue s'est produite"));
        }
    }
}