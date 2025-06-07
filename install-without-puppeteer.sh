#!/bin/bash

echo "🔧 تثبيت WhatsApp Manager بدون Puppeteer..."

# تعيين متغيرات البيئة لتجنب تنزيل Chromium
export PUPPETEER_SKIP_DOWNLOAD=true
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# حذف الملفات القديمة
echo "🗑️ حذف الملفات القديمة..."
rm -rf node_modules package-lock.json .next

# تنظيف cache
echo "🧹 تنظيف cache..."
npm cache clean --force

# تثبيت التبعيات الأساسية أولاً
echo "📦 تثبيت التبعيات الأساسية..."
npm install --legacy-peer-deps --no-optional

# إنشاء المجلدات الضرورية
echo "📁 إنشاء المجلدات..."
mkdir -p data logs backups

# تهيئة قاعدة البيانات بدون better-sqlite3
echo "🗄️ إنشاء قاعدة البيانات..."
node scripts/simple-init-db.js

echo "✅ تم التثبيت بنجاح!"
echo "🚀 تشغيل التطبيق..."
npm run build
npm start
