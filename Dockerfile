# # Build Stage
# FROM node:21.6-alpine3.18 AS builder

# # Set the working directory
# WORKDIR /app

# # Install backend dependencies
# COPY backend/package.json backend/package-lock.json /app/backend/
# RUN cd /app/backend && npm ci

# # Install frontend dependencies
# COPY ui/package.json ui/package-lock.json /app/ui/
# RUN cd /app/ui && npm ci

# # Copy source code after dependencies are installed
# COPY backend /app/backend
# COPY ui /app/ui

# # Transpile TypeScript files for the backend
# RUN cd /app/backend && npx tsc

# # Build frontend
# RUN cd /app/ui && npm run build

# # Production Stage
# FROM alpine:3.18

# # Install Node.js runtime
# RUN apk add --no-cache nodejs npm

# # Prepare output directories
# RUN mkdir -p /app/backend /app/ui /run/guest-services

# # Copy built files from the builder stage
# COPY --from=builder /app/backend/dist /app/backend
# COPY --from=builder /app/ui/build /app/ui

# # Set working directory for backend
# WORKDIR /app/backend

# # Expose backend port
# EXPOSE 3000

# # Run backend app
# CMD ["node", "dist/app.js", "-socket", "/run/guest-services/backend.sock"]

# Build Stage
FROM node:21.6-alpine3.18 AS builder

# Accept build-time argument for NODE_ENV
ARG NODE_ENV=development
# Set NODE_ENV for build-time usage
ENV NODE_ENV=${NODE_ENV}

# Set the working directory
WORKDIR /app

# Install backend dependencies
COPY backend/package.json backend/package-lock.json /app/backend/
RUN cd /app/backend && npm ci

# Install frontend dependencies
COPY ui/package.json ui/package-lock.json /app/ui/
RUN cd /app/ui && npm ci

# Copy source code after installing dependencies
COPY backend /app/backend
COPY ui /app/ui

# Transpile TypeScript files for the backend
RUN cd /app/backend && npx tsc

# Build frontend
RUN cd /app/ui && npm run build

# Production Stage
FROM alpine:3.18

# Install Node.js runtime
RUN apk add --no-cache nodejs npm

# Accept runtime argument for NODE_ENV (default is production)
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Prepare output directories
RUN mkdir -p /app/backend /app/ui /run/guest-services /metrics/proc /metrics/sys

# Copy built files from the builder stage
COPY --from=builder /app/backend/dist /app/backend
COPY --from=builder /app/ui/build /app/ui

# Set working directory for backend
WORKDIR /app/backend

# Expose backend port
EXPOSE 3000

# Run backend app based on NODE_ENV
CMD ["sh", "-c", "echo \"Running in NODE_ENV: $NODE_ENV\"; if [ \"$NODE_ENV\" = \"production\" ]; then node dist/app.js -socket /run/guest-services/backend.sock; else npm run start:dev; fi"]
