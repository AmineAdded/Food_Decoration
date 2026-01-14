# backend/Dockerfile
FROM eclipse-temurin:17-jdk-alpine as build

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers nécessaires pour Maven
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Donner les permissions et télécharger les dépendances
RUN chmod +x mvnw && \
    ./mvnw dependency:go-offline -B

# Copier le code source
COPY src src

# Build l'application
RUN ./mvnw clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copier le JAR depuis le build stage
COPY --from=build /app/target/*.jar app.jar

# Créer le répertoire pour les uploads
RUN mkdir -p /app/uploads/articles && \
    chmod 777 /app/uploads/articles

# Exposer le port
EXPOSE 8080

# Lancer l'application
ENTRYPOINT ["java", "-jar", "app.jar"]