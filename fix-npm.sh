#!/bin/bash

echo "🔧 إصلاح مشكلة npm..."

# الانتقال إلى مجلد النظام
cd /opt/whatsapp-manager

# إيقاف النظام
echo "⏳ إيقاف النظام..."
docker-compose down

# إنشاء package-lock.json
echo "⏳ إنشاء package-lock.json..."
npm install

# إعادة بناء الحاويات
echo "⏳ إعادة بناء الحاويات..."
docker-compose build --no-cache

# تشغيل النظام
echo "⏳ تشغيل النظام..."
docker-compose up -d

echo "✅ تم إصلاح المشكلة بنجاح!"

# التحقق من الحالة
sleep 10
docker-compose ps
