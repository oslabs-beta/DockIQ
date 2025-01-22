# Pull the *already-built* frontend image
FROM dockiq-frontend:latest as frontend

# Pull the *already-built* backend image
FROM dockiq-backend:latest as backend

# Base image for Prometheus
FROM prom/prometheus:latest as prometheus

# Final image for the Docker Desktop extension
FROM alpine:3.15

# Copy built frontend files
COPY --from=frontend /app/ui/build /ui

# Copy built backend files
COPY --from=backend /app/backend/dist /app/backend

# Copy Prometheus configuration file
COPY --from=prometheus /etc/prometheus/prometheus.yml /etc/prometheus/prometheus.yml

# Copy extension metadata and other assets
COPY metadata.json .
COPY docker-compose.yaml .
COPY docker.svg .

# Set extension labels, etc.
LABEL org.opencontainers.image.title="DockIQ Extension" \
      org.opencontainers.image.description="Docker monitoring health extension" \
      com.docker.desktop.extension.api.version="0.3.4"

# Keep container alive (if extension is purely UI-based)
CMD ["sleep", "infinity"]
