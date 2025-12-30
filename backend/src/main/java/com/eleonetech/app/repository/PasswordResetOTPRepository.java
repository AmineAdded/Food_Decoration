package com.eleonetech.app.repository;

import com.eleonetech.app.entity.PasswordResetOTP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetOTPRepository extends JpaRepository<PasswordResetOTP, Long> {
    Optional<PasswordResetOTP> findByEmailAndOtpCodeAndIsUsedFalseAndExpiresAtAfter(
            String email,
            String otpCode,
            LocalDateTime currentTime
    );

    void deleteByEmail(String email);

    void deleteByExpiresAtBefore(LocalDateTime currentTime);
}