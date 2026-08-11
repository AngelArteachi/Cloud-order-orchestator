# Multi-stage Dockerfile for API Gateway Service
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations & service files
COPY package*.json ./
COPY tsconfig.json ./
COPY services/api-gateway/package*.json ./services/api-gateway/
COPY services/api-gateway/tsconfig.json ./services/api-gateway/

RUN npm ci

# Copy source code and build
COPY services/api-gateway ./services/api-gateway
WORKDIR /app/services/api-gateway
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY services/api-gateway/package*.json ./services/api-gateway/

# Copy built artifacts and hoisted node_modules from builder workspace
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist

WORKDIR /app/services/api-gateway
EXPOSE 3000

CMD ["node", "dist/server.js"]
