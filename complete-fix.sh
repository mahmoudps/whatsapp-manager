#!/bin/bash

# تعيين الألوان
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 إصلاح شامل لـ WhatsApp Manager...${NC}"

# التأكد من وجود المجلد
cd /opt/whatsapp-manager || {
  echo -e "${RED}❌ مجلد التطبيق غير موجود${NC}"
  exit 1
}

# إيقاف النظام
echo -e "${YELLOW}⏳ إيقاف النظام...${NC}"
docker-compose down

# حذف node_modules و package-lock.json
echo -e "${YELLOW}⏳ تنظيف التبعيات القديمة...${NC}"
rm -rf node_modules package-lock.json

# تثبيت جميع التبعيات
echo -e "${YELLOW}⏳ تثبيت جميع التبعيات...${NC}"
npm install

# تحديث Dockerfile لتضمين devDependencies
echo -e "${YELLOW}⏳ تحديث Dockerfile...${NC}"
cat > Dockerfile << 'EOF'
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    python3 \
    make \
    g++ \
    sqlite \
    curl

# Set Puppeteer environment
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install && npm cache clean --force

# Copy app source
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S whatsapp -u 1001 -G nodejs

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
CMD ["npm", "start"]
EOF

# إعادة بناء وتشغيل النظام
echo -e "${YELLOW}⏳ إعادة بناء وتشغيل النظام...${NC}"
docker-compose build --no-cache
docker-compose up -d

# انتظار قليل للتأكد من بدء التشغيل
echo -e "${YELLOW}⏳ انتظار بدء التشغيل...${NC}"
sleep 10

echo -e "${GREEN}✅ تم إصلاح النظام وإعادة تشغيله${NC}"
echo -e "${YELLOW}📋 للتحقق من الحالة: wa-manager status${NC}"
echo -e "${YELLOW}📋 لعرض السجلات: wa-manager logs${NC}"
echo -e "${YELLOW}🌐 الوصول للنظام: https://wa-api.developments.world${NC}"
EOF
