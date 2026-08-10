# Multi-stage Dockerfile for Order Service
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations & service files
COPY package*.json ./
COPY tsconfig.json ./
COPY services/order-service/package*.json ./services/order-service/
COPY services/order-service/tsconfig.json ./services/order-service/

RUN npm ci

# Copy source code and build
COPY services/order-service ./services/order-service
WORKDIR /app/services/order-service
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY services/order-service/package*.json ./services/order-service/

RUN npm ci --only=production

COPY --from=builder /app/services/order-service/dist ./services/order-service/dist

WORKDIR /app/services/order-service
EXPOSE 3002

CMD ["node", "dist/app.js"]
