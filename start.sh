#!/bin/bash

# سكريبت تشغيل WhatsApp Manager

echo "🚀 بدء تشغيل WhatsApp Manager"

# التحقق من وجود ملف .env
if [ ! -f ".env" ]; then
    echo "❌ ملف .env غير موجود"
    echo "⚠️ قم بنسخ .env.example إلى .env وتعديل القيم"
    exit 1
fi

# إنشاء المجلدات المطلوبة
mkdir -p data/whatsapp_sessions data/media logs

# التحقق من قاعدة البيانات
if [ ! -f "./data/whatsapp_manager.db" ]; then
    echo "⚠️ قاعدة البيانات غير موجودة، سيتم إنشاؤها..."
    node scripts/init-database.js
fi

# إيقاف أي نسخة قديمة
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# تشغيل التطبيق
pm2 start ecosystem.config.js

if [ $? -eq 0 ]; then
    echo "✅ تم تشغيل التطبيق بنجاح"
    pm2 save
    sleep 3
    pm2 status
    echo ""
    echo "🌐 واجهة المستخدم: http://localhost:3000"
    echo "👤 اسم المستخدم: admin"
    echo "🔑 كلمة المرور: admin123"
else
    echo "❌ فشل تشغيل التطبيق"
    exit 1
fi
