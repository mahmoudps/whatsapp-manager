#!/bin/bash

echo "🚀 تشغيل WhatsApp Manager..."

# فحص وجود Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose غير مثبت!"
    echo "🔧 تشغيل: ./install-docker.sh لتثبيت Docker"
    exit 1
fi

# فحص تشغيل Docker
if ! systemctl is-active --quiet docker; then
    echo "🔄 تشغيل خدمة Docker..."
    systemctl start docker
fi

# إنشاء المجلدات
mkdir -p data logs

# تشغيل Docker Compose
echo "🐳 تشغيل الحاويات..."
docker-compose up -d

# فحص الحالة
sleep 5
if docker-compose ps | grep -q "Up"; then
    echo "✅ النظام يعمل على http://localhost:3000"
    echo "👤 المستخدم: admin | 🔑 كلمة المرور: admin123"
else
    echo "❌ فشل في تشغيل النظام"
    echo "📋 عرض السجلات: docker-compose logs"
fi
