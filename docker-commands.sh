#!/bin/bash

# أوامر إدارة Docker للنظام

case "$1" in
    "start")
        echo "🚀 تشغيل WhatsApp Manager..."
        docker-compose up -d
        ;;
    "stop")
        echo "🛑 إيقاف WhatsApp Manager..."
        docker-compose down
        ;;
    "restart")
        echo "🔄 إعادة تشغيل WhatsApp Manager..."
        docker-compose restart
        ;;
    "logs")
        echo "📋 عرض السجلات..."
        docker-compose logs -f
        ;;
    "status")
        echo "📊 حالة الخدمات..."
        docker-compose ps
        ;;
    "rebuild")
        echo "🔨 إعادة بناء النظام..."
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        ;;
    "backup")
        echo "💾 نسخ احتياطي للبيانات..."
        docker exec whatsapp-manager-app npm run backup-db
        ;;
    "shell")
        echo "🐚 الدخول لحاوية التطبيق..."
        docker exec -it whatsapp-manager-app sh
        ;;
    "clean")
        echo "🧹 تنظيف النظام..."
        docker-compose down -v
        docker system prune -f
        ;;
    *)
        echo "استخدام: $0 {start|stop|restart|logs|status|rebuild|backup|shell|clean}"
        echo ""
        echo "الأوامر المتاحة:"
        echo "  start    - تشغيل النظام"
        echo "  stop     - إيقاف النظام"
        echo "  restart  - إعادة تشغيل النظام"
        echo "  logs     - عرض السجلات"
        echo "  status   - عرض حالة الخدمات"
        echo "  rebuild  - إعادة بناء النظام"
        echo "  backup   - نسخ احتياطي للبيانات"
        echo "  shell    - الدخول لحاوية التطبيق"
        echo "  clean    - تنظيف النظام"
        ;;
esac
