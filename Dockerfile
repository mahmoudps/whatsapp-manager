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
    libxshmfence1 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libfreetype6 \
    libharfbuzz0b \
    fonts-freefont-ttf \
    fonts-noto-color-emoji \
    xdg-utils \
    python3 \
    procps \
    make \
    g++ \
    sqlite3 \
    curl \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm install --production && npm cache clean --force

COPY . .

RUN chmod +x start-production.sh

RUN npm run build

RUN addgroup --gid 1001 nodejs && \
    adduser --system --uid 1001 --gid 1001 whatsapp

RUN mkdir -p data logs && \
    chown -R whatsapp:nodejs /app

USER whatsapp

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "if [ -z \"$ADMIN_USERNAME\" ] || [ -z \"$ADMIN_PASSWORD\" ] || [ -z \"$JWT_SECRET\" ]; then echo 'Required environment variables are missing'; exit 1; fi && ./start-production.sh"]