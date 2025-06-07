#!/bin/bash

echo "🐳 إعداد WhatsApp Manager مع Docker..."

# التحقق من وجود Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker غير مثبت. يرجى تثبيت Docker أولاً."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose غير مثبت. يرجى تثبيت Docker Compose أولاً."
    exit 1
fi

# إنشاء المجلدات المطلوبة
echo "📁 إنشاء المجلدات..."
mkdir -p data logs

# إنشاء ملف البيئة إذا لم يكن موجوداً
if [ ! -f .env ]; then
    echo "📝 إنشاء ملف البيئة..."
    cat > .env << EOF
# إعدادات التطبيق
NODE_ENV=production
PORT=3000
HTTP_PORT=80
HTTPS_PORT=443

# إعدادات قاعدة البيانات
DATABASE_PATH=/app/data/whatsapp_manager.db

# إعدادات المصادقة
JWT_SECRET=whatsapp-manager-super-secret-jwt-key-2024
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
MAX_AUTH_ATTEMPTS=5
JWT_EXPIRES_IN=24h

# إعدادات WebSocket
ENABLE_WEBSOCKET=true
WEBSOCKET_PORT=3001

# إعدادات Puppeteer
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# إعدادات Redis
REDIS_PASSWORD=whatsapp123

# إعدادات السجلات
LOG_LEVEL=info
EOF
fi

# إيقاف الحاويات الموجودة
echo "🛑 إيقاف الحاويات الموجودة..."
docker-compose down

# بناء الصورة
echo "🔨 بناء صورة Docker..."
docker-compose build --no-cache

# تشغيل الخدمات
echo "🚀 تشغيل الخدمات..."
docker-compose up -d

# انتظار بدء الخدمات
echo "⏳ انتظار بدء الخدمات..."
sleep 30

# التحقق من حالة الخدمات
echo "🔍 التحقق من حالة الخدمات..."
docker-compose ps

# عرض السجلات
echo "📋 عرض السجلات..."
docker-compose logs --tail=50

echo ""
echo "✅ تم تشغيل WhatsApp Manager بنجاح!"
echo ""
echo "🌐 الوصول للنظام:"
echo "   URL: http://localhost:3000"
echo "   👤 اسم المستخدم: admin"
echo "   🔑 كلمة المرور: admin123"
echo ""
echo "📊 مراقبة السجلات:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 إيقاف النظام:"
echo "   docker-compose down"
echo ""
echo "🔄 إعادة تشغيل النظام:"
echo "   docker-compose restart"
