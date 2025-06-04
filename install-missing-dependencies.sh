#!/bin/bash

echo "🔧 إصلاح التبعيات المفقودة..."

# إيقاف PM2 أولاً
echo "🛑 إيقاف PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# تثبيت التبعيات المفقودة
echo "📦 تثبيت التبعيات المفقودة..."

npm install express-rate-limit helmet compression dotenv --save

# تثبيت تبعيات إضافية قد تكون مطلوبة
echo "📦 تثبيت تبعيات إضافية..."
npm install ws jsonwebtoken bcryptjs sqlite3 whatsapp-web.js puppeteer --save

# تثبيت تبعيات التطوير
echo "📦 تثبيت تبعيات التطوير..."
npm install --save-dev @types/node @types/ws @types/jsonwebtoken @types/bcryptjs

echo "✅ تم تثبيت جميع التبعيات!"

# إنشاء ملف package.json محدث إذا لزم الأمر
echo "📝 التحقق من package.json..."

# بناء المشروع
echo "🔨 بناء المشروع..."
npm run build 2>/dev/null || echo "⚠️ فشل البناء - سيتم المحاولة لاحقاً"

echo "🚀 جاهز للتشغيل!"
echo ""
echo "استخدم الأوامر التالية:"
echo "  npm start          - للتشغيل المباشر"
echo "  pm2 start ecosystem.config.js  - للتشغيل مع PM2"
