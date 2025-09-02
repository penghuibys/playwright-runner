# Use official Node.js image
FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies first (including Playwright)
RUN npm ci

# Install Playwright browsers and system dependencies
RUN npx playwright install-deps chromium
RUN npx playwright install chromium

# Copy and build source code
COPY . .
RUN npm run build

# Clean up dev dependencies
RUN npm prune --production

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
