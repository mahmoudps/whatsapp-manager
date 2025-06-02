# Multi-stage build for WhatsApp Manager
# Stage 1: Build dependencies
FROM node:20-slim AS dependencies

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build application
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Stage 3: Production runtime
FROM node:20-slim AS runtime

# Install runtime dependencies for Ubuntu 24.04
RUN apt-get update && apt-get install -y \
    chromium \
    sqlite3 \
    ca-certificates \
    procps \
    libxss1 \
    libgconf-2-4 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libxtst6 \
    libnss3 \
    libgbm1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set environment variables
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_ARGS="--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-accelerated-2d-canvas,--no-first-run,--no-zygote,--disable-gpu"

# Create application user
RUN groupadd --gid 1001 nodejs \
    && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home whatsapp

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=whatsapp:nodejs /app/.next ./.next
COPY --from=builder --chown=whatsapp:nodejs /app/public ./public
COPY --from=builder --chown=whatsapp:nodejs /app/package*.json ./
COPY --from=dependencies --chown=whatsapp:nodejs /app/node_modules ./node_modules

# Copy additional files
COPY --chown=whatsapp:nodejs lib ./lib
COPY --chown=whatsapp:nodejs app ./app
COPY --chown=whatsapp:nodejs components ./components
COPY --chown=whatsapp:nodejs scripts ./scripts
COPY --chown=whatsapp:nodejs *.js ./
COPY --chown=whatsapp:nodejs *.ts ./
COPY --chown=whatsapp:nodejs *.json ./
COPY --chown=whatsapp:nodejs .env* ./

# Create necessary directories
RUN mkdir -p data/whatsapp_sessions logs \
    && chown -R whatsapp:nodejs data logs \
    && chmod 755 data logs

# Switch to application user
USER whatsapp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Expose ports
EXPOSE 3000 3001

# Start command
CMD ["npm", "start"]

