# Multi-stage Dockerfile for Notification Service
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations & service files
COPY package*.json ./
COPY tsconfig.json ./
COPY services/notification-service/package*.json ./services/notification-service/
COPY services/notification-service/tsconfig.json ./services/notification-service/

RUN npm ci

# Copy source code and build
COPY services/notification-service ./services/notification-service
WORKDIR /app/services/notification-service
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY services/notification-service/package*.json ./services/notification-service/

# Copy built artifacts and hoisted node_modules from builder workspace
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist

WORKDIR /app/services/notification-service
EXPOSE 3003

CMD ["node", "dist/server.js"]
