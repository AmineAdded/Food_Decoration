package com.eleonetech.app.service;

import com.eleonetech.app.entity.PasswordResetOTP;
import com.eleonetech.app.entity.User;
import com.eleonetech.app.repository.PasswordResetOTPRepository;
import com.eleonetech.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetOTPRepository otpRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${otp.expiration.minutes:5}")
    private int otpExpirationMinutes;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public void sendPasswordResetOtp(String email) {
        // Vérifier si l'utilisateur existe
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Aucun compte n'est associé à cet email"));

        // Supprimer les anciens OTP pour cet email
        otpRepository.deleteByEmail(email);

        // Générer un code OTP à 6 chiffres
        String otpCode = generateOtpCode();

        // Créer et sauvegarder l'OTP
        PasswordResetOTP otp = PasswordResetOTP.builder()
                .email(email)
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusMinutes(otpExpirationMinutes))
                .isUsed(false)
                .build();

        otpRepository.save(otp);

        // Envoyer l'email avec le code OTP
        String userName = user.getFirstname() + " " + user.getLastname();
        emailService.sendOtpEmail(email, otpCode, userName);

        log.info("Code OTP envoyé à l'email: {}", email);
    }

    public boolean verifyOtp(String email, String otpCode) {
        return otpRepository.findByEmailAndOtpCodeAndIsUsedFalseAndExpiresAtAfter(
                email,
                otpCode,
                LocalDateTime.now()
        ).isPresent();
    }

    @Transactional
    public void resetPassword(String email, String otpCode, String newPassword) {
        // Vérifier l'OTP
        PasswordResetOTP otp = otpRepository.findByEmailAndOtpCodeAndIsUsedFalseAndExpiresAtAfter(
                email,
                otpCode,
                LocalDateTime.now()
        ).orElseThrow(() -> new RuntimeException("Code OTP invalide ou expiré"));

        // Récupérer l'utilisateur
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Mettre à jour le mot de passe
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Marquer l'OTP comme utilisé
        otp.setIsUsed(true);
        otpRepository.save(otp);

        log.info("Mot de passe réinitialisé avec succès pour: {}", email);
    }

    private String generateOtpCode() {
        int otp = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(otp);
    }

    // Nettoyage automatique des OTP expirés (toutes les heures)
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void cleanupExpiredOtps() {
        otpRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        log.info("Nettoyage des OTP expirés effectué");
    }
}