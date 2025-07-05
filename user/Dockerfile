# Stage 1: Build the application
FROM gradle:8.14-jdk21 AS build

# Set working directory
WORKDIR /app

# Copy gradle configuration files first (better caching)
COPY build.gradle settings.gradle ./

# Copy just the gradle wrapper
COPY gradle ./gradle

# Download dependencies only when build.gradle changes
RUN gradle dependencies --no-daemon

# Copy source code
COPY src ./src

# Build the application
RUN gradle bootJar --no-daemon

# Stage 2: Run the application
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy the built JAR file from the build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Expose the port the app runs on
EXPOSE 8082

# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]