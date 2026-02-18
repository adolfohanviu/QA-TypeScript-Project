# Multi-stage build for TypeScript Playwright test suite

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies including dev dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install Playwright system dependencies
RUN apk add --no-cache \
    libstdc++ \
    libx11 \
    libxss1 \
    libx11-xcb \
    libxcb1 \
    libxrender1 \
    libxext6 \
    libxkbcommon \
    libfreetype6 \
    fontconfig

# Install browsers
RUN npx -y playwright install && \
    npx -y playwright install-deps

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tests ./tests
COPY --from=builder /app/playwright.config.ts ./

# Copy other necessary files
COPY .env.example .env.example

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('ready')" || exit 1

# Default command
CMD ["npm", "run", "test"]

# Support for multiple entry points via environment variables
# TEST_TYPE=ui npm test:ui
# TEST_TYPE=api npm test:api
