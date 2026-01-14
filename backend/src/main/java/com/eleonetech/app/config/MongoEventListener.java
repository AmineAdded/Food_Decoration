package com.eleonetech.app.config;

import com.eleonetech.app.entity.*;
import com.eleonetech.app.entity.Process;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertEvent;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Listener pour gérer automatiquement les timestamps (createdAt, updatedAt)
 * avant la sauvegarde dans MongoDB
 */
@Component
public class MongoEventListener extends AbstractMongoEventListener<Object> {

    @Override
    public void onBeforeConvert(BeforeConvertEvent<Object> event) {
        Object entity = event.getSource();
        LocalDateTime now = LocalDateTime.now();

        if (entity instanceof Article article) {
            if (article.getCreatedAt() == null) {
                article.setCreatedAt(now);
            }
            article.setUpdatedAt(now);
        } else if (entity instanceof Client client) {
            if (client.getCreatedAt() == null) {
                client.setCreatedAt(now);
            }
            client.setUpdatedAt(now);
        } else if (entity instanceof Process process) {
            if (process.getCreatedAt() == null) {
                process.setCreatedAt(now);
            }
            process.setUpdatedAt(now);
        } else if (entity instanceof Commande commande) {
            if (commande.getCreatedAt() == null) {
                commande.setCreatedAt(now);
            }
            commande.setUpdatedAt(now);
        } else if (entity instanceof Livraison livraison) {
            if (livraison.getCreatedAt() == null) {
                livraison.setCreatedAt(now);
            }
            livraison.setUpdatedAt(now);
        } else if (entity instanceof Production production) {
            if (production.getCreatedAt() == null) {
                production.setCreatedAt(now);
            }
            production.setUpdatedAt(now);
        } else if (entity instanceof User user) {
            if (user.getCreatedAt() == null) {
                user.setCreatedAt(now);
            }
            user.setUpdatedAt(now);
        } else if (entity instanceof PasswordResetOTP otp) {
            if (otp.getCreatedAt() == null) {
                otp.setCreatedAt(now);
            }
        }
    }
}