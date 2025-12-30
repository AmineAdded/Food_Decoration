package com.eleonetech.app.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otpCode, String userName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Code de réinitialisation - Flower & Flower");

            String htmlContent = buildOtpEmailTemplate(otpCode, userName);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("OTP email envoyé avec succès à: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email OTP à: {}", toEmail, e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email");
        }
    }

    private String buildOtpEmailTemplate(String otpCode, String userName) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #E91E63, #F06292); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .header h1 { color: white; margin: 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .otp-box { background: white; border: 2px dashed #E91E63; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #E91E63; letter-spacing: 5px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🌸 Flower & Flower</h1>
                    </div>
                    <div class="content">
                        <h2>Bonjour """ + userName + """,</h2>
                        <p>Vous avez demandé à réinitialiser votre mot de passe. Voici votre code de vérification :</p>
                        
                        <div class="otp-box">
                            <div class="otp-code">""" + otpCode + """</div>
                        </div>
                        
                        <p><strong>Ce code est valable pendant 5 minutes.</strong></p>
                        <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
                        
                        <div class="footer">
                            <p>Ceci est un email automatique, merci de ne pas y répondre.</p>
                            <p>&copy; 2024 Flower & Flower - L'art de la décoration florale</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """;
    }
}