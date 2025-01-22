# Build backend
FROM node:18.12-alpine3.16 AS backend-builder
WORKDIR /backend
COPY backend/package.json /backend/package.json
COPY backend/package-lock.json /backend/package-lock.json
RUN npm ci
COPY backend /backend

# Build frontend
FROM --platform=$BUILDPLATFORM node:18.12-alpine3.16 AS client-builder
WORKDIR /ui
COPY ui/package.json /ui/package.json
COPY ui/package-lock.json /ui/package-lock.json
RUN npm ci
COPY ui /ui
RUN npm run build

# Final image
FROM node:18.12-alpine3.16
LABEL org.opencontainers.image.title="DockIQ" \
    org.opencontainers.image.description="Docker monitoring with node-exporter integration" \
    org.opencontainers.image.vendor="DockIQ" \
    com.docker.desktop.extension.api.version="0.3.4"

COPY docker-compose.yaml .
COPY metadata.json .
COPY dockiq.svg .
COPY --from=backend-builder /backend backend
COPY --from=client-builder /ui/build ui

# Copy config files
COPY configs/grafana grafana 
COPY configs/prometheus prometheus

WORKDIR /backend
CMD ["npm", "start"]