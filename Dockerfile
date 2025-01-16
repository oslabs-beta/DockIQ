# Base image for both backend and frontend
FROM node:21.6-alpine3.18 AS builder
WORKDIR /app

# Copy both backend and frontend package.json and package-lock.json files
COPY backend/package.json /app/backend/package.json
COPY backend/package-lock.json /app/backend/package-lock.json
COPY ui/package.json /app/ui/package.json
COPY ui/package-lock.json /app/ui/package-lock.json

# Install dependencies for both frontend and backend
WORKDIR /app/backend
RUN npm ci

WORKDIR /app/ui
RUN npm ci

# Copy source code for both frontend and backend
COPY backend /app/backend
COPY ui /app/ui

# Build the backend (TypeScript) and frontend (e.g., React)
WORKDIR /app/backend
RUN npm run build

WORKDIR /app/ui
RUN npm run build

# Stage 2: Final Image
FROM alpine:3.18

# Install Node.js runtime for both frontend and backend
RUN apk add --no-cache nodejs npm

# Copy the built frontend and backend into the final image
COPY --from=builder /app/backend/dist /app/backend
COPY --from=builder /app/ui/build /app/ui

# Copy additional files (docker-compose, metadata, etc.)
COPY docker-compose.yaml /app/
COPY metadata.json /app/
COPY docker.svg /app/

# Set the working directory for backend and expose the backend port
WORKDIR /app/backend
EXPOSE 3000

# Command to run the backend app (using dist/app.js)
CMD ["node", "/app/backend/dist/app.js", "-socket", "/run/guest-services/backend.sock"]
