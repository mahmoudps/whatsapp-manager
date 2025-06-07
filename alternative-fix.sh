#!/bin/bash

# تعيين الألوان
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 إصلاح بديل لـ WhatsApp Manager...${NC}"

# التأكد من وجود المجلد
cd /opt/whatsapp-manager || {
  echo -e "${RED}❌ مجلد التطبيق غير موجود${NC}"
  exit 1
}

# إنشاء ملف next.config.js جديد
echo -e "${YELLOW}⏳ تحديث ملف next.config.js...${NC}"
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['socket.io', 'express', 'cors', 'helmet', 'compression'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('socket.io', 'express', 'cors', 'helmet', 'compression');
    }
    return config;
  },
};

module.exports = nextConfig;
EOF

# تثبيت المكتبات المفقودة
echo -e "${YELLOW}⏳ تثبيت المكتبات المفقودة...${NC}"
npm install --save socket.io express cors helmet compression

# إنشاء ملف package-lock.json
echo -e "${YELLOW}⏳ إنشاء ملف package-lock.json...${NC}"
npm install

# إعادة بناء وتشغيل النظام
echo -e "${YELLOW}⏳ إعادة بناء وتشغيل النظام...${NC}"
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo -e "${GREEN}✅ تم إصلاح التبعيات وإعادة تشغيل النظام${NC}"
echo -e "${YELLOW}📋 للتحقق من الحالة: wa-manager status${NC}"
echo -e "${YELLOW}📋 لعرض السجلات: wa-manager logs${NC}"
