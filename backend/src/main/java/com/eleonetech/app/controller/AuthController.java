package com.eleonetech.app.controller;

import com.eleonetech.app.dto.*;
import com.eleonetech.app.service.AuthService;
import com.eleonetech.app.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "${cors.allowed-origins}")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest request) {
        try {
            AuthResponse response = authService.signup(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Email ou mot de passe incorrect"));
        }
    }

    // NOUVEAU: Endpoint pour rafraîchir le token
    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401)
                        .body(new MessageResponse("Non authentifié"));
            }

            String email = authentication.getName();
            AuthResponse response = authService.refreshToken(email);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            passwordResetService.sendPasswordResetOtp(request.getEmail());
            return ResponseEntity.ok(new MessageResponse(
                    "Un code de vérification a été envoyé à votre adresse email"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            boolean isValid = passwordResetService.verifyOtp(
                    request.getEmail(),
                    request.getOtpCode()
            );

            if (isValid) {
                return ResponseEntity.ok(new MessageResponse("Code OTP valide"));
            } else {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Code OTP invalide ou expiré"));
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            passwordResetService.resetPassword(
                    request.getEmail(),
                    request.getOtpCode(),
                    request.getNewPassword()
            );
            return ResponseEntity.ok(new MessageResponse(
                    "Mot de passe réinitialisé avec succès"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/test")
    public ResponseEntity<MessageResponse> test() {
        return ResponseEntity.ok(new MessageResponse("API fonctionne correctement!"));
    }
}