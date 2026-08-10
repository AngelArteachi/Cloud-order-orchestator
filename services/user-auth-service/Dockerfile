# Multi-stage Dockerfile for User & Auth Service
FROM node:20-alpine AS builder

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

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY services/user-auth-service/package*.json ./services/user-auth-service/

RUN npm ci --only=production

COPY --from=builder /app/services/user-auth-service/dist ./services/user-auth-service/dist
COPY --from=builder /app/services/user-auth-service/node_modules/@prisma ./services/user-auth-service/node_modules/@prisma
COPY --from=builder /app/services/user-auth-service/prisma ./services/user-auth-service/prisma

WORKDIR /app/services/user-auth-service
EXPOSE 3001

CMD ["node", "dist/app.js"]
