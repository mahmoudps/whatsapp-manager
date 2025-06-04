#!/bin/bash

echo "🛑 إيقاف WhatsApp Manager"

pm2 stop all
pm2 delete all

echo "✅ تم إيقاف التطبيق"
