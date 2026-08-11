# Multi-stage Dockerfile for Payment Service
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations & service files
COPY package*.json ./
COPY tsconfig.json ./
COPY services/payment-service/package*.json ./services/payment-service/
COPY services/payment-service/tsconfig.json ./services/payment-service/

RUN npm ci

# Copy source code and build
COPY services/payment-service ./services/payment-service
WORKDIR /app/services/payment-service
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY services/payment-service/package*.json ./services/payment-service/

# Copy built artifacts and hoisted node_modules from builder workspace
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/payment-service/dist ./services/payment-service/dist

WORKDIR /app/services/payment-service
EXPOSE 3004

CMD ["node", "dist/server.js"]
