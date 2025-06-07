#!/bin/bash
set -euo pipefail

echo "🛑 إيقاف WhatsApp Manager..."

# إيقاف الحاويات
docker-compose down

echo "✅ تم إيقاف النظام"
