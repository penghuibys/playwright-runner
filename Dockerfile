# Base image (with Node.js 18 and TypeScript)
FROM node:18-slim AS base

# Install system dependencies (required libraries for Playwright)
RUN apt-get update && apt-get install -y \
    # Basic utilities
    curl \
    wget \
    gnupg \
    ca-certificates \
    # Playwright browser dependencies
    libnss3 \
    libnspr4 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libgconf-2-4 \
    libxtst6 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (avoid permission risks)
RUN useradd -m appuser
USER appuser
WORKDIR /home/appuser/app

# Build stage
FROM base AS builder

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY src ./src
COPY tests ./tests

# Compile TypeScript
RUN npm run build

# Production stage
FROM base AS production

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Install Playwright browsers (needs to be after npm install)
# Switch to root user to install system dependencies, then switch back to appuser
USER root
RUN npx playwright install-deps chromium
USER appuser
RUN npx playwright install chromium

# Copy compiled results
COPY --from=builder /home/appuser/app/dist ./dist

# Expose health check port
EXPOSE 3000

# Startup command
CMD ["node", "dist/index.js"]
