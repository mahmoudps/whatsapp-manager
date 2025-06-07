#!/bin/bash

echo "🔧 الإصلاح النهائي لـ WhatsApp Manager..."

# حذف الملفات القديمة
echo "🗑️ حذف الملفات القديمة..."
rm -rf node_modules package-lock.json .next
rm -f lib/logger.js lib/websocket-server.js

# تنظيف cache
echo "🧹 تنظيف cache..."
npm cache clean --force

# تثبيت التبعيات
echo "📦 تثبيت التبعيات..."
npm install --legacy-peer-deps

# إنشاء المجلدات الضرورية
echo "📁 إنشاء المجلدات..."
mkdir -p data logs backups

# تهيئة قاعدة البيانات
echo "🗄️ تهيئة قاعدة البيانات..."
npm run init-db

# البناء والتشغيل
echo "🚀 بناء وتشغيل التطبيق..."
npm run production
