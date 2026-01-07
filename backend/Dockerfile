# backend/Dockerfile
FROM eclipse-temurin:17-jdk-alpine as build

# Définir le répertoire de travail
WORKDIR /app

# Copier le fichier Maven wrapper et pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Télécharger les dépendances (mise en cache)
RUN ./mvnw dependency:go-offline -B

# Copier le code source
COPY src src

# Build l'application (skip tests pour accélérer)
RUN ./mvnw clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copier le JAR depuis le build stage
COPY --from=build /app/target/*.jar app.jar

# Créer le répertoire pour les uploads
RUN mkdir -p /app/uploads/articles

# Exposer le port
EXPOSE 8080

# Variables d'environnement par défaut
ENV SPRING_PROFILES_ACTIVE=prod

# Lancer l'application
ENTRYPOINT ["java", "-jar", "app.jar"]