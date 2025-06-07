#!/bin/bash

# سكريبت إيقاف WhatsApp Manager

echo "🛑 إيقاف WhatsApp Manager..."

# البحث عن عمليات التطبيق
NODE_PIDS=$(pgrep -f "node.*server.js")
NEXT_PIDS=$(pgrep -f "node.*next")

# إيقاف عمليات الخادم
if [ -n "$NODE_PIDS" ]; then
  echo "🔄 إيقاف عمليات الخادم..."
  kill $NODE_PIDS
  echo "✅ تم إيقاف عمليات الخادم"
else
  echo "ℹ️ لا توجد عمليات خادم نشطة"
fi

# إيقاف عمليات Next.js
if [ -n "$NEXT_PIDS" ]; then
  echo "🔄 إيقاف عمليات Next.js..."
  kill $NEXT_PIDS
  echo "✅ تم إيقاف عمليات Next.js"
else
  echo "ℹ️ لا توجد عمليات Next.js نشطة"
fi

# إيقاف عمليات Chromium المرتبطة بـ WhatsApp
CHROME_PIDS=$(pgrep -f "chromium.*whatsapp")
if [ -n "$CHROME_PIDS" ]; then
  echo "🔄 إيقاف عمليات Chromium..."
  kill $CHROME_PIDS
  echo "✅ تم إيقاف عمليات Chromium"
else
  echo "ℹ️ لا توجد عمليات Chromium نشطة"
fi

echo "🎉 تم إيقاف WhatsApp Manager بنجاح"
