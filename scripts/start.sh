#!/bin/bash
set -euo pipefail

# سكريبت تشغيل WhatsApp Manager

echo "🚀 بدء تشغيل WhatsApp Manager..."

# التأكد من وجود ملف .env
if [ ! -f .env ]; then
  echo "❌ ملف .env غير موجود"
  echo "💡 نصيحة: قم بتشغيل 'npm run setup' لإعداد التطبيق"
  exit 1
fi

# التأكد من وجود قاعدة البيانات
DB_PATH=$(grep DATABASE_PATH .env | cut -d '=' -f2)
if [ -z "$DB_PATH" ]; then
  DB_PATH="./data/whatsapp_manager.db"
fi

if [ ! -f "$DB_PATH" ]; then
  echo "❌ قاعدة البيانات غير موجودة في $DB_PATH"
  echo "💡 نصيحة: قم بتشغيل 'npm run init-db' لإنشاء قاعدة البيانات"
  exit 1
fi

# التأكد من تثبيت التبعيات
if [ ! -d "node_modules" ]; then
  echo "❌ التبعيات غير مثبتة"
  echo "💡 نصيحة: قم بتشغيل 'npm install' لتثبيت التبعيات"
  exit 1
fi

# التأكد من بناء التطبيق
if [ ! -d ".next" ]; then
  echo "⚠️ التطبيق غير مبني"
  echo "🔄 جاري بناء التطبيق..."
  npm run build
fi

# تشغيل التطبيق
echo "✅ جاري تشغيل التطبيق..."
npm start
