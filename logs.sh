#!/bin/bash

echo "📋 عرض سجلات WhatsApp Manager..."

# عرض السجلات
docker-compose logs -f --tail=50
