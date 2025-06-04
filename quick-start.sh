#!/bin/bash

echo "🚀 بدء تشغيل WhatsApp Manager..."

# تشغيل سكريبت الإصلاح أولاً
if [ -f "fix-config-issue.sh" ]; then
    chmod +x fix-config-issue.sh
    ./fix-config-issue.sh
fi

# تثبيت التبعيات
echo "📦 تثبيت التبعيات..."
npm install --legacy-peer-deps

# بناء المشروع
echo "🔨 بناء المشروع..."
npm run build

# تشغيل النظام
echo "🚀 تشغيل النظام..."
if command -v pm2 &> /dev/null; then
    echo "استخدام PM2..."
    pm2 start ecosystem.config.js
    pm2 logs
else
    echo "تشغيل مباشر..."
    npm start
fi
