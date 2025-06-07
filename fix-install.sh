#!/bin/bash

echo "🔧 إصلاح مشاكل التثبيت..."

# حذف الملفات القديمة
echo "🗑️ حذف الملفات القديمة..."
rm -rf node_modules package-lock.json .next

# تنظيف cache
echo "🧹 تنظيف cache..."
npm cache clean --force

# إصلاح الثغرات الأمنية
echo "🔒 إصلاح الثغرات الأمنية..."
npm audit fix --force

# تثبيت التبعيات
echo "📦 تثبيت التبعيات..."
npm install --legacy-peer-deps

# التحقق من التثبيت
echo "✅ التحقق من التثبيت..."
npm run type-check

echo "🎉 تم الإصلاح بنجاح!"
