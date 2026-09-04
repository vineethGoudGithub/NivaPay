# ==============================================================================
# Stage 1: Build the Spring Boot application using Maven
# ==============================================================================
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Cache Maven dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package application
COPY src ./src
RUN mvn clean package -DskipTests

# ==============================================================================
# Stage 2: Runtime image with Eclipse Temurin JRE
# ==============================================================================
FROM eclipse-temurin:17-jre
WORKDIR /app

# Default environment variables
ENV PORT=6060
ENV SPRING_PROFILES_ACTIVE=prod

# Copy compiled JAR from builder stage
COPY --from=build /app/target/*.jar app.jar

# Expose the configured backend application port
EXPOSE 6060

# Run the Spring Boot application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]