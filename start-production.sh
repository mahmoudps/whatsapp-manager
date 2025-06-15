#!/bin/bash
set -e

cd "$(dirname "$0")"

set -e

echo "🚀 بدء تشغيل WhatsApp Manager في وضع الإنتاج..."

# تحميل متغيرات البيئة من الملف .env إن وجد
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$ADMIN_USERNAME" ] || [ -z "$ADMIN_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
  echo "❌ ADMIN_USERNAME, ADMIN_PASSWORD, and JWT_SECRET must be set"
  exit 1
fi

# التأكد من وجود المجلدات الضرورية
mkdir -p logs data backups
# Ensure proper ownership so the container can write to the database and logs
if [ "$(id -u)" -eq 0 ]; then
    chown -R 1001:1001 data logs
fi

# دالة للتحقق من أن المنفذ متاح قبل التشغيل
is_port_free() {
  if lsof -i:"$1" >/dev/null 2>&1 || ss -ltn | grep -q ":$1\\b"; then
    return 1
  else
    return 0
  fi
}

# تأكد من توفر متصفح Chrome أو Chromium لـ Puppeteer
if [ -n "$PUPPETEER_EXECUTABLE_PATH" ] && [ ! -x "$PUPPETEER_EXECUTABLE_PATH" ]; then
  echo "⚠️  Browser not found at $PUPPETEER_EXECUTABLE_PATH"
  echo "⬇️  Falling back to bundled Chromium"
  unset PUPPETEER_EXECUTABLE_PATH
fi

if [ -z "$PUPPETEER_EXECUTABLE_PATH" ]; then
  PUPPETEER_CACHE_DIR=${PUPPETEER_CACHE_DIR:-/app/.cache/puppeteer}
  export PUPPETEER_CACHE_DIR
  if [ ! -d "$PUPPETEER_CACHE_DIR" ] || [ -z "$(ls -A "$PUPPETEER_CACHE_DIR" 2>/dev/null)" ]; then
    echo "🔍 Installing Chromium for Puppeteer..."
    npx puppeteer browsers install chrome >/dev/null 2>&1
  fi
  if [ -z "$PUPPETEER_EXECUTABLE_PATH" ]; then
    PUPPETEER_EXECUTABLE_PATH=$(npx puppeteer browsers path chrome 2>/dev/null)
    export PUPPETEER_EXECUTABLE_PATH
  fi
fi

# إنشاء قاعدة البيانات إذا لم تكن موجودة
if [ ! -f "data/whatsapp_manager.db" ]; then
  echo "🗄️ إنشاء قاعدة البيانات..."
  node scripts/init-database.js
  status=$?
  if [ $status -ne 0 ]; then
    echo "❌ فشل إنشاء قاعدة البيانات"
    exit $status
  fi
fi

# تشغيل WebSocket Server
if [ "$ENABLE_WEBSOCKET" = "true" ]; then
  if [ ! -f ./dist/websocket-server.js ]; then
    echo "⚠️  dist/websocket-server.js غير موجود. سيتم محاولة إنشائه..." >&2
    npm run build:ws >/tmp/build_ws.log 2>&1
    status=$?
    if [ $status -ne 0 ] || [ ! -f ./dist/websocket-server.js ]; then
      echo "❌ فشل إنشاء dist/websocket-server.js" >&2
      cat /tmp/build_ws.log >&2
      exit 1
    fi
  fi
  echo "📡 تشغيل WebSocket Server..."
  if ! is_port_free "$WEBSOCKET_PORT"; then
    echo "❌ Port $WEBSOCKET_PORT already in use" >&2
    exit 1
  fi
  node ./dist/websocket-server.js >logs/websocket.log 2>&1 &
  WS_PID=$!
  echo "WebSocket Server PID: $WS_PID"
  sleep 1
  if ! kill -0 "$WS_PID" 2>/dev/null; then
    echo "❌ تعذر تشغيل WebSocket Server"
    tail -n 20 logs/websocket.log
    exit 1
  fi
  trap 'echo "📡 إيقاف WebSocket Server..."; kill $WS_PID' EXIT
fi

# تشغيل Next.js
echo "🌐 تشغيل Next.js..."
npm start

# إيقاف WebSocket Server عند الخروج
if [ "$ENABLE_WEBSOCKET" = "true" ]; then
  echo "📡 إيقاف WebSocket Server..."
  kill $WS_PID
fi

echo "✅ تم إيقاف WhatsApp Manager"
