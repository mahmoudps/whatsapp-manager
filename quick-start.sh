#!/bin/bash

echo "🚀 بدء التثبيت والتشغيل السريع لـ WhatsApp Manager..."

# فحص وجود Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker غير مثبت. جاري التثبيت..."
    chmod +x install-docker.sh
    ./install-docker.sh
    echo "✅ تم تثبيت Docker"
fi

# فحص وجود Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose غير مثبت. جاري التثبيت..."
    chmod +x install-docker.sh
    ./install-docker.sh
    echo "✅ تم تثبيت Docker Compose"
fi

# فحص تشغيل Docker
if ! systemctl is-active --quiet docker; then
    echo "🔄 تشغيل خدمة Docker..."
    systemctl start docker
fi

# إنشاء المجلدات المطلوبة
echo "📁 إنشاء المجلدات..."
mkdir -p data logs

# إيقاف أي حاويات قديمة
echo "🛑 إيقاف الحاويات القديمة..."
docker-compose down 2>/dev/null || true

# بناء وتشغيل الحاويات
echo "🏗️ بناء وتشغيل النظام..."
docker-compose up -d --build

# انتظار تشغيل النظام
echo "⏳ انتظار تشغيل النظام..."
sleep 30

# فحص حالة الحاويات
echo "🔍 فحص حالة النظام..."
docker-compose ps

# عرض السجلات
echo "📋 آخر السجلات:"
docker-compose logs --tail=10

echo ""
echo "✅ تم تشغيل WhatsApp Manager بنجاح!"
echo "🌐 الوصول للنظام: http://localhost:3000"
echo "👤 المستخدم: admin"
echo "🔑 كلمة المرور: admin123"
echo ""
echo "📋 أوامر مفيدة:"
echo "  عرض السجلات: ./logs.sh"
echo "  إيقاف النظام: ./stop.sh"
echo "  إعادة تشغيل: ./start.sh"
