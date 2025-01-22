# ----------------------------------------
# 1) Builder stage
# ----------------------------------------
  FROM --platform=$BUILDPLATFORM node:18.9-alpine3.15 AS backend_builder

  WORKDIR /app/backend
  
  # Step 1: Copy package files
  COPY package.json package-lock.json ./
  
  # Step 2: Show what's in package.json (debug)
  RUN echo "=== package.json contents ===" \
   && cat /app/backend/package.json \
   && echo "=== end package.json ==="
  
  # Step 3: Install all dependencies including dev deps
  RUN --mount=type=cache,target=/usr/src/app/.npm \
      npm set cache /usr/src/app/.npm && \
      npm ci --include=dev
  
  # Step 4: Copy the rest of the source code, including tsconfig.json, etc.
  COPY . /app/backend
  
  # Step 5: Debug what's in /app/backend
  RUN echo "=== Files in /app/backend after COPY ===" \
   && ls -al /app/backend
  
  # Step 6: Run the build script (must call tsc)
  RUN echo "=== Running npm run build ===" \
   && npm run build
  
  # Step 7: Debug: list the dist folder to confirm it exists
  RUN echo "=== Dist folder contents ===" \
   && ls -al /app/backend/dist || echo "No dist folder found!"
  
  # ----------------------------------------
  # 2) Final stage
  # ----------------------------------------
  FROM alpine:3.15 AS backend
  
  # Install Node.js and npm (for runtime)
  RUN apk add --no-cache nodejs npm

  # Set the working directory
  WORKDIR /app/backend
  
  # (Optional) Labels for Docker Desktop extension
  LABEL org.opencontainers.image.title="DockIQ Backend" \
        org.opencontainers.image.description="Backend for the DockIQ Docker Desktop extension." \
        org.opencontainers.image.vendor="TheChefs" \
        org.opencontainers.image.licenses="Apache-2.0" \
        com.docker.desktop.extension.api.version=">= 0.3.0" \
        com.docker.desktop.extension.icon="" \
        com.docker.extension.screenshots='[{"alt":"DockIQ Backend", "url":"https://example.com/screenshot.png"}]' \
        com.docker.extension.detailed-description="<h1>DockIQ Backend</h1><p>Backend for monitoring Docker container health and metrics.</p>" \
        com.docker.extension.publisher-url="https://thechefs.com" \
        com.docker.extension.additional-urls='[{"title":"DockIQ Docs","url":"https://docs.thechefs.com"}]' \
        com.docker.extension.changelog="<ul><li>Initial backend implementation for DockIQ.</li></ul>"
  
  # Copy the dist folder, node_modules, and package.json from the builder stage
  COPY --from=backend_builder /app/backend/dist /app/backend/dist
  COPY --from=backend_builder /app/backend/node_modules /app/backend/node_modules
  COPY --from=backend_builder /app/backend/package.json /app/backend/package.json

  
  # Expose port if needed
  EXPOSE 3000
  
  # Start the backend
  CMD ["npm", "--prefix", "/app/backend", "start"]
  