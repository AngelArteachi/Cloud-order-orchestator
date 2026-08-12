# Multi-stage Dockerfile for Inventory Service
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations & service files
COPY package*.json ./
COPY tsconfig.json ./
COPY services/inventory-service/package*.json ./services/inventory-service/
COPY services/inventory-service/tsconfig.json ./services/inventory-service/

RUN npm ci

# Copy source code and build
COPY services/inventory-service ./services/inventory-service
WORKDIR /app/services/inventory-service
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY services/inventory-service/package*.json ./services/inventory-service/

# Copy built artifacts and hoisted node_modules from builder workspace
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/inventory-service/dist ./services/inventory-service/dist

WORKDIR /app/services/inventory-service
EXPOSE 3005

CMD ["node", "dist/server.js"]
