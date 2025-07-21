# Base stage with Node.js
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci --only=production; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Development stage
FROM base AS development
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV development

CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
ENV NODE_ENV production
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Create uploads directory
RUN mkdir -p uploads && chown nextjs:nodejs uploads

USER nextjs

EXPOSE 3000
ENV PORT 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]

# Testing stage
FROM builder AS testing
WORKDIR /app

# Install all dependencies including dev dependencies
RUN npm ci

# Copy test files
COPY jest.config.js jest.setup.js ./
COPY app/__tests__ ./app/__tests__

# Run tests
RUN npm test

# Production image with testing verification
FROM production AS verified-production
COPY --from=testing /app/.next ./next

# Backup stage for database operations
FROM alpine:latest AS backup
RUN apk add --no-cache postgresql-client aws-cli curl

COPY backup/scripts /scripts
RUN chmod +x /scripts/*

CMD ["/scripts/backup.sh"] 