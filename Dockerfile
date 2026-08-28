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

# Install browsers.
# NOTE: `playwright install-deps` only knows how to provision apt-based
# (Debian/Ubuntu) systems; on Alpine (musl, apk) it is effectively a no-op,
# so browser OS deps here rely entirely on the manual `apk add` list above.
# WebKit in particular is not officially supported on musl/Alpine and may
# fail to launch even with that list. If e2e-in-Docker proves unreliable,
# switch this stage's base image to a glibc-based one (e.g. node:20-slim)
# or the official mcr.microsoft.com/playwright image.
RUN npx -y playwright install && \
    npx -y playwright install-deps

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install full dependency set: this image runs the test suites themselves
# (jest/ts-jest for API tests, @playwright/test for E2E tests), so the
# jest/ts-jest/typescript devDependencies must be present at runtime, not
# just @playwright/test.
RUN npm ci

# Copy built application from builder stage. Both the Jest (ts-jest) and
# Playwright test runners resolve the "@/*" -> "src/*" path alias straight
# from TypeScript sources at run time, so src/ must ship alongside dist/.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/tests ./tests
COPY --from=builder /app/jest.config.ts ./
COPY --from=builder /app/playwright.config.ts ./

# Copy other necessary files
COPY .env.example .env.example

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('ready')" || exit 1

# Default command: runs the full suite (API via Jest, then E2E via Playwright).
CMD ["npm", "run", "test"]

# To run a single layer instead, override the container command, e.g.:
#   docker run <image> npm run test:api
#   docker run <image> npm run test:e2e
