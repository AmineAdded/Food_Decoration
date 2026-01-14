package com.eleonetech.app.repository;

import com.eleonetech.app.entity.PasswordResetOTP;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetOTPRepository extends MongoRepository<PasswordResetOTP, String> {
    Optional<PasswordResetOTP> findByEmailAndOtpCodeAndIsUsedFalseAndExpiresAtAfter(
            String email,
            String otpCode,
            LocalDateTime currentTime
    );

    List<PasswordResetOTP> findByEmail(String email);
    void deleteByEmail(String email);
    void deleteByExpiresAtBefore(LocalDateTime currentTime);
}