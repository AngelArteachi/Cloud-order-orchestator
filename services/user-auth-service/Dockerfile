# Multi-stage Dockerfile for User & Auth Service
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy root configurations & service files
COPY package*.json ./
COPY tsconfig.json ./
COPY services/user-auth-service/package*.json ./services/user-auth-service/
COPY services/user-auth-service/tsconfig.json ./services/user-auth-service/
COPY services/user-auth-service/prisma ./services/user-auth-service/prisma

RUN npm ci

# Copy source code and build
COPY services/user-auth-service ./services/user-auth-service
WORKDIR /app/services/user-auth-service
RUN npx prisma generate
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY services/user-auth-service/package*.json ./services/user-auth-service/

# Copy built artifacts and hoisted node_modules from builder workspace
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/user-auth-service/dist ./services/user-auth-service/dist
COPY --from=builder /app/services/user-auth-service/prisma ./services/user-auth-service/prisma

WORKDIR /app/services/user-auth-service
EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]
