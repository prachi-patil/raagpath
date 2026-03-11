# ═══════════════════════════════════════════════════════════════════
#  RaagPath — Multi-stage Dockerfile
#
#  Stage 1 : Build Next.js → static export (out/)
#  Stage 2 : Copy static files into Spring Boot + build bootWar
#  Stage 3 : Minimal JRE runtime image
#
#  Final image: single container, port 8080
#    /api/*  → Spring Boot REST
#    /*      → Next.js static files served by Spring Boot
# ═══════════════════════════════════════════════════════════════════

# ── Stage 1: Next.js static build ───────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

# Empty = relative URLs → same-origin requests to Spring Boot /api/*
ENV NEXT_PUBLIC_API_URL=""

RUN npm run build
# Output: /app/out/


# ── Stage 2: Spring Boot WAR build ──────────────────────────────────
FROM eclipse-temurin:21-jdk AS backend-builder
WORKDIR /app

# Copy Gradle wrapper + build files first (better layer caching)
COPY backend/gradle/        gradle/
COPY backend/gradlew        ./
COPY backend/settings.gradle backend/build.gradle ./
RUN chmod +x gradlew

# Pre-download dependencies (cached unless build.gradle changes)
RUN ./gradlew dependencies --no-daemon -q 2>/dev/null || true

# Copy source
COPY backend/src/ src/

# Inject Next.js static output into Spring Boot's static resources
# Spring Boot will serve these at / automatically
COPY --from=frontend-builder /app/out/ src/main/resources/static/

# Build executable WAR
RUN ./gradlew bootWar --no-daemon

# ── Stage 3: Runtime ─────────────────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app

# Non-root user
RUN groupadd -r raagpath && useradd -r -g raagpath raagpath
USER raagpath

COPY --from=backend-builder /app/build/libs/*.war app.war

EXPOSE 8080

ENTRYPOINT ["java", \
  "-Xms256m", \
  "-Xmx512m", \
  "-Dspring.profiles.active=prod", \
  "-jar", "app.war"]
