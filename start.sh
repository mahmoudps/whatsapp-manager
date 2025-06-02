#!/bin/bash

# سكريبت التشغيل السريع لنظام إدارة واتساب
# Quick Start Script for WhatsApp Manager

echo "🚀 بدء تشغيل نظام إدارة واتساب..."
echo "🚀 Starting WhatsApp Manager System..."

# التحقق من Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. يرجى تثبيت Node.js أولاً"
    echo "❌ Node.js is not installed. Please install Node.js first"
    exit 1
fi

# التحقق من npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm غير مثبت. يرجى تثبيت npm أولاً"
    echo "❌ npm is not installed. Please install npm first"
    exit 1
fi

echo "✅ Node.js و npm متوفران"
echo "✅ Node.js and npm are available"

# تثبيت التبعيات إذا لم تكن مثبتة
if [ ! -d "node_modules" ]; then
    echo "📦 تثبيت التبعيات..."
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

# إعداد قاعدة البيانات
echo "🗄️ إعداد قاعدة البيانات..."
echo "🗄️ Setting up database..."
npm run setup

# بدء التشغيل
echo "🌟 بدء تشغيل النظام..."
echo "🌟 Starting the system..."

# التحقق من المنفذ المتاح
PORT=3000
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ المنفذ $PORT مستخدم، سيتم استخدام منفذ بديل"
    echo "⚠️ Port $PORT is in use, will use alternative port"
    PORT=3001
fi

echo "🌐 النظام سيعمل على: http://localhost:$PORT"
echo "🌐 System will run on: http://localhost:$PORT"
echo ""
echo "🔐 بيانات الدخول الافتراضية:"
echo "🔐 Default login credentials:"
echo "   اسم المستخدم / Username: admin"
echo "   كلمة المرور / Password: admin123"
echo ""
echo "⏳ انتظر حتى يكتمل التحميل ثم افتح الرابط في المتصفح"
echo "⏳ Wait for loading to complete then open the link in browser"
echo ""

# تشغيل النظام
npm run dev

