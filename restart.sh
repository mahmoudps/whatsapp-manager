#!/bin/bash

echo "🔄 إعادة تشغيل WhatsApp Manager"

pm2 restart all

if [ $? -eq 0 ]; then
    echo "✅ تم إعادة تشغيل التطبيق"
    sleep 3
    pm2 status
else
    echo "❌ فشل إعادة تشغيل التطبيق"
fi
