#!/bin/bash

echo "🚀 بدء تشغيل WhatsApp Manager في وضع الإنتاج..."

# التأكد من وجود المجلدات الضرورية
mkdir -p logs data backups

# إنشاء قاعدة البيانات إذا لم تكن موجودة
if [ ! -f "data/whatsapp_manager.db" ]; then
  echo "🗄️ إنشاء قاعدة البيانات..."
  node scripts/init-database.js
fi

# تشغيل WebSocket Server
if [ "$ENABLE_WEBSOCKET" = "true" ]; then
  echo "📡 تشغيل WebSocket Server..."
  node -e "require('./lib/websocket-server.js')" &
  WS_PID=$!
  echo "WebSocket Server PID: $WS_PID"
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
