#!/bin/bash

echo "🔧 إصلاح مشاكل التثبيت..."

# حذف node_modules و package-lock.json
echo "🗑️ حذف الملفات القديمة..."
rm -rf node_modules
rm -f package-lock.json

# تنظيف cache npm
echo "🧹 تنظيف cache npm..."
npm cache clean --force

# تثبيت التبعيات مع حل التعارضات
echo "📦 تثبيت التبعيات..."
npm install --legacy-peer-deps

# التحقق من التثبيت
echo "✅ التحقق من التثبيت..."
npm audit --audit-level=moderate

echo "🎉 تم إصلاح مشاكل التثبيت بنجاح!"
echo "يمكنك الآن تشغيل: npm run dev"
