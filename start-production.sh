#!/bin/bash

echo "🚀 بدء تشغيل WhatsApp Manager في وضع الإنتاج..."

if [ -z "$ADMIN_USERNAME" ] || [ -z "$ADMIN_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
  echo "❌ ADMIN_USERNAME, ADMIN_PASSWORD, and JWT_SECRET must be set"
  exit 1
fi

# التأكد من وجود المجلدات الضرورية
mkdir -p logs data backups
# Ensure proper ownership so the container can write to the database and logs
chown -R 1001:1001 data logs

# إنشاء قاعدة البيانات إذا لم تكن موجودة
if [ ! -f "data/whatsapp_manager.db" ]; then
  echo "🗄️ إنشاء قاعدة البيانات..."
  node scripts/init-database.js
fi

# تشغيل WebSocket Server
if [ "$ENABLE_WEBSOCKET" = "true" ]; then
  echo "📡 تشغيل WebSocket Server..."
  node ./websocket-server.js &
  WS_PID=$!
  echo "WebSocket Server PID: $WS_PID"
  trap 'echo "📡 إيقاف WebSocket Server..."; kill $WS_PID' EXIT
fi

# تشغيل Next.js
echo "🌐 تشغيل Next.js..."
npm run production

# إيقاف WebSocket Server عند الخروج
if [ "$ENABLE_WEBSOCKET" = "true" ]; then
  echo "📡 إيقاف WebSocket Server..."
  kill $WS_PID
fi

echo "✅ تم إيقاف WhatsApp Manager"
