# Backend Stage (using Node.js instead of Go)
FROM node:21.6-alpine3.18 AS backend-builder

WORKDIR /backend

# Copy backend files and install dependencies
COPY backend/package.json backend/package-lock.json ./
RUN npm install

# Copy the remaining backend files
COPY backend ./

# Install frontend dependencies (from your client-builder stage)
FROM node:21.6-alpine3.18 AS client-builder

WORKDIR /ui
COPY ui/package.json /ui/package.json
COPY ui/package-lock.json /ui/package-lock.json
RUN npm ci

COPY ui /ui
RUN npm run build

# Final Image: Alpine base for lightweight image
FROM alpine

LABEL org.opencontainers.image.title="DockIQ" \
    org.opencontainers.image.description="Docker Monitoring Extension" \
    org.opencontainers.image.vendor="capstone6" \
    com.docker.desktop.extension.api.version="1.0" \
    com.docker.extension.icon="docker.svg"

# Copy the backend and frontend builds
COPY --from=backend-builder /backend /backend
COPY --from=client-builder /ui/build /ui

# Copy additional files (docker-compose, metadata, etc.)
COPY docker-compose.yaml .
COPY metadata.json .
COPY docker.svg .

# Start the backend service (adjust the command as needed)
CMD ["npm", "start", "--prefix", "/backend"]
