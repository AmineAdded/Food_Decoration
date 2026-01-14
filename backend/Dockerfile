FROM eclipse-temurin:17-jdk-alpine as build

WORKDIR /app

# Copier Maven wrapper et pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Télécharger dépendances
RUN ./mvnw dependency:go-offline -B

# Copier le code source
COPY src src

# Build (skip tests pour accélérer le déploiement)
RUN ./mvnw clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copier le JAR
COPY --from=build /app/target/*.jar app.jar

# Créer répertoire uploads
RUN mkdir -p /app/uploads/articles

EXPOSE 8080

ENV SPRING_PROFILES_ACTIVE=prod

ENTRYPOINT ["java", "-jar", "app.jar"]