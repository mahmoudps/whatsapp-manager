FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
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
    xdg-utils \
    libfreetype6 \
    libharfbuzz0b \
    fonts-freefont-ttf \
    python3 \
    make \
    g++ \
    sqlite3 \
    curl \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Set Puppeteer environment
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production && npm cache clean --force

# Copy app source
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup --gid 1001 nodejs && \
    adduser --system --uid 1001 --gid 1001 whatsapp

# Create directories and set permissions
RUN mkdir -p data logs && \
    chown -R whatsapp:nodejs /app

# Switch to non-root user
USER whatsapp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["sh", "-c", "if [ -z \"$ADMIN_USERNAME\" ] || [ -z \"$ADMIN_PASSWORD\" ] || [ -z \"$JWT_SECRET\" ]; then echo 'Required environment variables are missing'; exit 1; fi && npm start"]
