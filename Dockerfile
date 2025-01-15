FROM node:21.6-alpine3.18 AS backend-builder

WORKDIR /backend


COPY backend/package.json backend/package-lock.json ./
RUN npm install

# Copy the remaining backend files
COPY backend ./


FROM node:21.6-alpine3.18 AS client-builder

WORKDIR /ui
COPY ui/package.json /ui/package.json
COPY ui/package-lock.json /ui/package-lock.json
RUN npm ci

COPY ui /ui
RUN npm run build


FROM alpine

LABEL org.opencontainers.image.title="DockIQ" \
    org.opencontainers.image.description="Docker Monitoring Extension" \
    org.opencontainers.image.vendor="capstone6" \
    com.docker.desktop.extension.api.version="0.3.4" \
    com.docker.extension.icon="docker.svg"


COPY --from=backend-builder /backend /backend
COPY --from=client-builder /ui/build /ui


COPY docker-compose.yaml .
COPY metadata.json .
COPY docker.svg .

CMD ["npm", "start", "--prefix", "/backend"]
