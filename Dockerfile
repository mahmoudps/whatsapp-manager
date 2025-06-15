FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    gnupg \
    ca-certificates && \
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list' && \
    apt-get update && apt-get install -y \
    google-chrome-stable \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxshmfence1 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libfreetype6 \
    libharfbuzz0b \
    libxss1 \
    libxkbcommon0 \
    libxtst6 \
    libxext6 \
    libxfixes3 \
    libu2f-udev \
    libvulkan1 \
    fonts-freefont-ttf \
    fonts-noto-color-emoji \
    xdg-utils \
    python3 \
    procps \
    make \
    g++ \
    sqlite3 \
    iproute2 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Prevent Puppeteer from downloading Chromium during install
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true


WORKDIR /app

# Build-time variables
ARG NEXT_PUBLIC_WEBSOCKET_URL
ARG NEXT_PUBLIC_DOMAIN_NAME
ARG NEXT_PUBLIC_WHATSAPP_API_URL
ENV NEXT_PUBLIC_WEBSOCKET_URL=${NEXT_PUBLIC_WEBSOCKET_URL}
ENV NEXT_PUBLIC_DOMAIN_NAME=${NEXT_PUBLIC_DOMAIN_NAME}
ENV NEXT_PUBLIC_WHATSAPP_API_URL=${NEXT_PUBLIC_WHATSAPP_API_URL}

# Copy package manifests first for better Docker layer caching
COPY package.json package-lock.json .npmrc tsconfig.ws.json tsconfig.json ./

# Install dependencies with development packages enabled
ENV NODE_ENV=development
# Use a temporary database during build to avoid SQLite locking errors
ENV DATABASE_PATH=/tmp/whatsapp_manager_build.db
RUN npm ci --ignore-scripts && npm cache clean --force
RUN npm run rebuild:native

# Copy the rest of the application source
COPY . .

# Ensure helper scripts are executable
RUN chmod +x start-production.sh scripts/generate-env.js

# Ensure required environment variables exist before building
RUN node scripts/generate-env.js

# Use production mode when building the Next.js application
ENV NODE_ENV=production
RUN npm run build
RUN npm run build:ws

# Use the real database location at runtime
ENV DATABASE_PATH=/app/data/whatsapp_manager.db
# Use the Chromium binary installed in the image with crashpad disabled
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV PUPPETEER_ARGS=--disable-crashpad

# Remove development dependencies after the build to keep the image slim
RUN npm prune --production && npm cache clean --force

RUN addgroup --gid 1001 nodejs && \
    adduser --system --uid 1001 --gid 1001 whatsapp

RUN mkdir -p data logs && \
    chown -R whatsapp:nodejs /app

USER whatsapp

EXPOSE 3000
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "if [ -z \"$ADMIN_USERNAME\" ] || [ -z \"$ADMIN_PASSWORD\" ] || [ -z \"$JWT_SECRET\" ]; then echo 'Required environment variables are missing'; exit 1; fi && ./start-production.sh"]
