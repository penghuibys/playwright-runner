# Use official Node.js image
FROM node:18-slim

# Install system dependencies and Playwright browser dependencies
RUN apt-get update && apt-get install -y \
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

# Create non-root user first
RUN useradd --create-home --shell /bin/bash appuser

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies first (including Playwright)
RUN npm ci

# Install Playwright system dependencies (as root)
RUN npx playwright install-deps chromium

# Copy and build source code
COPY . .
RUN npm run build

# Clean up dev dependencies but keep playwright
RUN npm prune --production

# Change ownership and switch to appuser
RUN chown -R appuser:appuser /app
USER appuser

# Install Playwright browsers as appuser (to correct user cache directory)
RUN npx playwright install chromium

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
