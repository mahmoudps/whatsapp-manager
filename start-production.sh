#!/bin/bash

echo "🚀 بدء تشغيل WhatsApp Manager في وضع الإنتاج..."

# تحميل المتغيرات من الملف .env إن وجد
if [ -f .env ]; then
  while IFS='=' read -r key value; do
    # تخطي الأسطر الفارغة أو المسبوقة بملاحظات
    if [[ -z "$key" || "$key" =~ ^# ]]; then
      continue
    fi
    # قم بتصدير المتغير فقط إذا لم يكن محددًا مسبقًا
    # إزالة أي محارف CR قد تتسبب بعدم تطابق القيم
    value="${value//$'\r'/}"
    if [ -z "${!key+x}" ]; then
      export "$key"="${value}"
    fi
  done < .env
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

# تأكد من توفر متصفح Chrome أو Chromium لـ Puppeteer
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
fi

# تشغيل WebSocket Server
if [ "$ENABLE_WEBSOCKET" = "true" ]; then
  echo "📡 تشغيل WebSocket Server..."
  node ./dist/websocket-server.js &
  WS_PID=$!
  echo "WebSocket Server PID: $WS_PID"
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
