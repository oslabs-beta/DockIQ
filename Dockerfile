FROM node:21.6-alpine3.18 AS builder
WORKDIR /app

# Copy and install backend dependencies
COPY backend/package.json backend/package-lock.json /app/backend/
WORKDIR /app/backend
RUN npm install

# Copy and install frontend dependencies
COPY ui/package.json ui/package-lock.json /app/ui/
WORKDIR /app/ui
RUN npm install

# Copy source code after dependencies are installed
COPY backend /app/backend
COPY ui /app/ui

# Build the backend (TypeScript)
WORKDIR /app/backend
RUN npm run build # Runs `tsc` based on the package.json script

# Build the frontend
WORKDIR /app/ui
RUN npm run build

# Production stage
FROM alpine:3.18

# Install Node.js runtime
RUN apk add --no-cache nodejs npm

# Copy the built backend and frontend
COPY --from=builder /app/backend/dist /app/backend
COPY --from=builder /app/ui/build /app/ui

# Set the working directory for the backend
WORKDIR /app/backend

# Expose the backend port
EXPOSE 3000

# Command to run the backend app
CMD ["node", "dist/app.js", "-socket", "/run/guest-services/backend.sock"]
