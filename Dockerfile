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
#
# Uses the official Playwright image instead of node:20-alpine: it ships all
# three browsers and their OS dependencies pre-installed on a glibc (Ubuntu)
# base. The previous alpine + manual `apk add` + `playwright install-deps`
# approach didn't actually work — `install-deps` only knows how to provision
# apt-based systems and is a no-op on musl/Alpine, and WebKit in particular
# isn't officially supported there at all. Pin the tag to the exact
# @playwright/test version in package.json.
FROM mcr.microsoft.com/playwright:v1.62.1-noble

WORKDIR /app

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
