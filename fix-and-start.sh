#!/bin/bash

echo "🚀 إصلاح شامل وتشغيل WhatsApp Manager..."

# تشغيل سكريبت إصلاح التبعيات
if [ -f "install-missing-dependencies.sh" ]; then
    chmod +x install-missing-dependencies.sh
    ./install-missing-dependencies.sh
fi

# التأكد من وجود الملفات المطلوبة
echo "📁 التحقق من الملفات المطلوبة..."

# إنشاء مجلدات مطلوبة
mkdir -p data logs data/whatsapp_sessions data/media

# تعيين الصلاحيات
chmod 755 data logs
chmod 755 data/whatsapp_sessions data/media

# تشغيل النظام
echo "🚀 تشغيل النظام..."

# محاولة التشغيل المباشر أولاً
echo "تجربة التشغيل المباشر..."
npm start &
SERVER_PID=$!

# انتظار قليل للتحقق من نجاح التشغيل
sleep 5

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ النظام يعمل بنجاح!"
    echo "🌐 يمكنك الوصول للنظام عبر: http://localhost:3000"
    echo "👤 اسم المستخدم: admin"
    echo "🔑 كلمة المرور: admin123"
    echo ""
    echo "للإيقاف اضغط Ctrl+C"
    wait $SERVER_PID
else
    echo "❌ فشل التشغيل المباشر، محاولة استخدام PM2..."
    pm2 start ecosystem.config.js
    pm2 logs
fi
