
FROM --platform=$BUILDPLATFORM node:18.9-alpine3.15 AS ui-builder

# Set working directory in the builder
WORKDIR /app/ui

# Copy only package files first (for better caching)
COPY package.json /app/ui/package.json
COPY package-lock.json /app/ui/package-lock.json

# Cache npm folder to speed up builds
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm ci

# Now copy the rest of your UI code
COPY . /app/ui

# Build the UI
# (Assuming "npm run build" outputs the production build in /app/ui/build)
RUN npm run build

# (Optional) Check that /app/ui/build exists
RUN ls -al /app/ui/build

##
# 2) Final Stage
##
FROM alpine:3.15

# If your final UI environment needs Node (for a Node-based server or serve library), install it.
# If it's purely static, you might skip installing Node.
RUN apk add --no-cache nodejs npm

# Metadata for Docker Desktop extension, or just normal image labels
LABEL org.opencontainers.image.title="DockIQ UI" \
      org.opencontainers.image.description="Frontend for the DockIQ Docker Desktop extension." \
      org.opencontainers.image.vendor="TheChefs" \
      org.opencontainers.image.licenses="Apache-2.0" \
      com.docker.desktop.extension.api.version=">= 0.3.0" \
      com.docker.desktop.extension.icon="" \
      com.docker.extension.screenshots='[{"alt":"DockIQ UI", "url":"https://example.com/screenshot.png"}]' \
      com.docker.extension.detailed-description="<h1>DockIQ UI</h1><p>Frontend for monitoring Docker container health and metrics.</p>" \
      com.docker.extension.publisher-url="https://thechefs.com" \
      com.docker.extension.additional-urls='[{"title":"DockIQ Docs","url":"https://docs.thechefs.com"}]' \
      com.docker.extension.changelog="<ul><li>Initial UI implementation for DockIQ.</li></ul>"

# Copy the built UI from the builder stage into /app/ui/build in the final image
COPY --from=ui-builder /app/ui/build /ui

# If you want to serve it, you could install serve globally:
RUN npm install -g serve

# Expose port if you plan to serve it directly
EXPOSE 3000

# Launch a basic server to serve the static files
CMD ["serve", "/app/ui/build"]

