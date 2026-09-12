# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package configurations for workspaces
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/

# Install dependencies (ignoring scripts initially to avoid running prisma gen prematurely)
RUN npm ci --ignore-scripts

# Copy Prisma schema and generate client
COPY apps/backend/prisma ./apps/backend/prisma
RUN npx prisma generate --schema=./apps/backend/prisma/schema.prisma

# Copy source code and build
COPY apps/backend ./apps/backend
RUN npm run build --workspace=apps/backend

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install curl for healthchecks and chromium for Puppeteer PDF rendering
RUN apk add --no-cache curl chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV CHROMIUM_PATH=/usr/bin/chromium-browser

# Copy package configurations and install only production dependencies
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
RUN npm ci --omit=dev --workspace=apps/backend

# Copy built artifacts and prisma client from builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3001

# Start the Node process
CMD ["node", "apps/backend/dist/index.js"]
