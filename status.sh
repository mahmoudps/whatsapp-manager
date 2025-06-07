#!/bin/bash

echo "📊 حالة WhatsApp Manager..."

# عرض حالة الحاويات
echo "🐳 حالة الحاويات:"
docker-compose ps

echo ""
echo "💾 استخدام الموارد:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "🌐 فحص الاتصال:"
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ النظام يعمل بشكل صحيح"
else
    echo "❌ النظام لا يستجيب"
fi
