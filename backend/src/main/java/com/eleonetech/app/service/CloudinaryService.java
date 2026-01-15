package com.eleonetech.app.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String uploadImage(MultipartFile file) throws IOException {
        try {
            // Validation
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IOException("Le fichier doit être une image");
            }

            // Générer un nom unique
            String originalFilename = file.getOriginalFilename();
            String publicId = "article_" + UUID.randomUUID().toString().substring(0, 8);

            if (originalFilename != null) {
                String nameWithoutExt = originalFilename.contains(".")
                        ? originalFilename.substring(0, originalFilename.lastIndexOf('.'))
                        : originalFilename;

                // ✅ NETTOYER LE NOM : remplacer espaces par tirets ou underscores
                String cleanName = nameWithoutExt
                        .replaceAll("\\s+", "_")  // Remplacer espaces par _
                        .replaceAll("[^a-zA-Z0-9_-]", ""); // Garder seulement alphanum, _ et -

                publicId = "food_decoration_" + cleanName + "_" + UUID.randomUUID().toString().substring(0, 6);
            }

            // Upload vers Cloudinary
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "food-decoration/articles",
                            "public_id", publicId,
                            "overwrite", true,
                            "resource_type", "image"
                    )
            );

            String imageUrl = uploadResult.get("secure_url").toString();
            log.info("✅ Image uploadée sur Cloudinary: {}", imageUrl);

            return imageUrl;

        } catch (Exception e) {
            log.error("❌ Erreur lors de l'upload Cloudinary: ", e);
            throw new IOException("Erreur lors de l'enregistrement de l'image: " + e.getMessage());
        }
    }

    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return;
        }

        try {
            String publicId = extractPublicIdFromUrl(imageUrl);

            if (publicId != null) {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                log.info("✅ Image supprimée de Cloudinary: {}", publicId);
            } else {
                log.warn("⚠️ Impossible d'extraire le public_id de l'URL: {}", imageUrl);
            }
        } catch (Exception e) {
            log.error("❌ Erreur lors de la suppression Cloudinary: {}", e.getMessage());
        }
    }

    private String extractPublicIdFromUrl(String imageUrl) {
        try {
            // Format: https://res.cloudinary.com/cloudname/image/upload/v1234567/folder/filename.jpg
            String[] parts = imageUrl.split("/");

            // Trouver l'index après "upload"
            int uploadIndex = -1;
            for (int i = 0; i < parts.length; i++) {
                if ("upload".equals(parts[i])) {
                    uploadIndex = i;
                    break;
                }
            }

            if (uploadIndex == -1 || uploadIndex + 2 >= parts.length) {
                return null;
            }

            // Construire public_id: folder/filename (sans extension)
            StringBuilder publicId = new StringBuilder();
            for (int i = uploadIndex + 2; i < parts.length; i++) {
                if (publicId.length() > 0) publicId.append("/");
                publicId.append(parts[i]);
            }

            // Retirer l'extension
            String fullPublicId = publicId.toString();
            int dotIndex = fullPublicId.lastIndexOf('.');
            if (dotIndex > 0) {
                return fullPublicId.substring(0, dotIndex);
            }
            return fullPublicId;

        } catch (Exception e) {
            log.error("Erreur extraction public_id: {}", e.getMessage());
            return null;
        }
    }
}