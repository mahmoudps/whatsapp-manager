#!/bin/bash

echo "🔧 إصلاح مشكلة ملف التكوين..."

# التأكد من وجود مجلد lib
if [ ! -d "lib" ]; then
    echo "📁 إنشاء مجلد lib..."
    mkdir -p lib
fi

# التحقق من وجود ملف lib/config.js
if [ ! -f "lib/config.js" ]; then
    echo "📝 إنشاء ملف lib/config.js..."
    cat > lib/config.js << 'EOF'
require("dotenv").config()

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'your-secret-key' : undefined)

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is not defined in production environment')
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

module.exports = { JWT_SECRET, JWT_EXPIRES_IN }
EOF
    echo "✅ تم إنشاء ملف lib/config.js"
fi

# التحقق من وجود ملف .env
if [ ! -f ".env" ]; then
    echo "📝 إنشاء ملف .env..."
    cat > .env << 'EOF'
# إعدادات الخادم
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# إعدادات JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# إعدادات المدير
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
MAX_AUTH_ATTEMPTS=5

# إعدادات قاعدة البيانات
DATABASE_PATH=./data/whatsapp_manager.db

# إعدادات WebSocket
WEBSOCKET_PORT=3001
ENABLE_WEBSOCKET=true
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001

# إعدادات WhatsApp
WHATSAPP_SERVER_PORT=3002
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# إعدادات الدومين
NEXT_PUBLIC_DOMAIN_NAME=localhost
NEXT_PUBLIC_WHATSAPP_API_URL=http://localhost:3000/api
FRONTEND_URL=http://localhost:3000

# إعدادات السجلات
LOG_LEVEL=info
EOF
    echo "✅ تم إنشاء ملف .env"
fi

# التأكد من وجود مجلد data
if [ ! -d "data" ]; then
    echo "📁 إنشاء مجلد data..."
    mkdir -p data
    chmod 755 data
fi

# إيقاف PM2 إذا كان يعمل
echo "🛑 إيقاف PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

echo "✅ تم إصلاح مشكلة التكوين!"
echo ""
echo "🚀 يمكنك الآن تشغيل النظام باستخدام:"
echo "   ./start.sh"
echo "   أو"
echo "   npm run dev"
