#!/bin/bash

# WhatsApp Manager CLI
# إصدار: 1.0.0
# الوصف: أداة سطر الأوامر لإدارة نظام WhatsApp Manager

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# المسار الافتراضي
DEFAULT_PATH="/opt/whatsapp-manager"
# مسار السكريبت
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# المسار الحالي
CURRENT_PATH="$SCRIPT_DIR"

# Exit immediately if a command exits with a non-zero status
set -e

# تحديد أمر Docker Compose المتاح
if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# التحقق من تشغيل السكريبت بصلاحيات الجذر
require_root() {
    if [[ $EUID -ne 0 ]]; then
        echo "Please run as root"
        exit 1
    fi
}

# التحقق من وجود الملفات المطلوبة
check_files() {
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}❌ ملف docker-compose.yml غير موجود${NC}"
        return 1
    fi
    
    if [ ! -f "Dockerfile" ]; then
        echo -e "${RED}❌ ملف Dockerfile غير موجود${NC}"
        return 1
    fi
    
    return 0
}

# ضبط صلاحيات مجلدي البيانات والسجلات
fix_permissions() {
    if ! chown -R 1001:1001 data logs 2>/dev/null; then
        echo -e "${YELLOW}⚠️ تعذر تعديل صلاحيات المجلدات data و logs. قد يؤدي هذا إلى أخطاء في قاعدة البيانات.${NC}"
    fi
}

# عرض المساعدة
show_help() {
    echo -e "${BLUE}=== WhatsApp Manager CLI ===${NC}"
    echo -e "${CYAN}الاستخدام:${NC} wa-manager [الأمر] [الخيارات]"
    echo ""
    echo -e "${YELLOW}الأوامر المتاحة:${NC}"
    echo -e "  ${GREEN}help${NC}        عرض هذه المساعدة"
    echo -e "  ${GREEN}start${NC}       تشغيل النظام"
    echo -e "  ${GREEN}stop${NC}        إيقاف النظام"
    echo -e "  ${GREEN}restart${NC}     إعادة تشغيل النظام"
    echo -e "  ${GREEN}status${NC}      عرض حالة النظام"
    echo -e "  ${GREEN}logs${NC}        عرض سجلات النظام"
    echo -e "  ${GREEN}install${NC}     تثبيت النظام (docker|pm2|full|cli)"
    echo -e "  ${GREEN}uninstall${NC}   إزالة النظام"
    echo -e "  ${GREEN}clean${NC}       تنظيف الملفات المؤقتة"
    echo -e "  ${GREEN}monitor${NC}     مراقبة النظام"
    echo -e "  ${GREEN}env${NC}         عرض/تعديل متغيرات البيئة"
    echo -e "  ${GREEN}update${NC}      تحديث النظام"
    echo -e "  ${GREEN}backup${NC}      نسخ احتياطي لقاعدة البيانات"
    echo -e "  ${GREEN}restore${NC}     استعادة قاعدة البيانات"
    echo -e "  ${GREEN}rebuild${NC}     إعادة تهيئة ملف .env"
    echo ""
    echo -e "${YELLOW}أمثلة:${NC}"
    echo -e "  ${CYAN}wa-manager install docker${NC}    تثبيت Docker و Docker Compose"
    echo -e "  ${CYAN}wa-manager install full${NC}      تثبيت كامل مع دعم SSL"
    echo -e "  ${CYAN}wa-manager install cli${NC}       تثبيت الأمر فقط"
    echo -e "  ${CYAN}wa-manager start${NC}             تشغيل النظام"
    echo -e "  ${CYAN}wa-manager env${NC}               عرض متغيرات البيئة"
    echo -e "  ${CYAN}wa-manager rebuild${NC}           إعادة تهيئة ملف .env"
}

# تثبيت Docker و Docker Compose
install_docker() {
    require_root
    echo -e "${BLUE}🐳 تثبيت Docker و Docker Compose...${NC}"
    
    # التحقق من وجود Docker
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✅ Docker مثبت بالفعل${NC}"
    else
        echo -e "${YELLOW}⏳ تثبيت Docker...${NC}"
        if ! curl -fsSL https://get.docker.com -o get-docker.sh; then
            echo -e "${RED}❌ فشل تحميل برنامج تثبيت Docker${NC}"
            return 1
        fi
        if ! sh get-docker.sh; then
            echo -e "${RED}❌ فشل تثبيت Docker${NC}"
            rm -f get-docker.sh
            return 1
        fi
        rm -f get-docker.sh
        
        # تمكين وتشغيل Docker
        systemctl enable docker
        systemctl start docker
        
        # إضافة المستخدم الحالي إلى مجموعة docker
        usermod -aG docker $USER
        
        echo -e "${GREEN}✅ تم تثبيت Docker بنجاح${NC}"
    fi
    
    # التحقق من وجود Docker Compose
    if command -v docker-compose &> /dev/null || docker compose version >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker Compose مثبت بالفعل${NC}"
    else
        echo -e "${YELLOW}⏳ تثبيت Docker Compose...${NC}"
        
        # تثبيت Docker Compose
        if ! curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose; then
            echo -e "${RED}❌ فشل تحميل Docker Compose${NC}"
            return 1
        fi
        if ! chmod +x /usr/local/bin/docker-compose; then
            echo -e "${RED}❌ فشل إعداد صلاحيات Docker Compose${NC}"
            return 1
        fi

        echo -e "${GREEN}✅ تم تثبيت Docker Compose بنجاح${NC}"
    fi
}

# تثبيت PM2
install_pm2() {
    require_root
    echo -e "${BLUE}📦 تثبيت PM2...${NC}"
    
    # التحقق من وجود Node.js و npm
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}⏳ تثبيت Node.js...${NC}"
        if ! curl -fsSL https://deb.nodesource.com/setup_20.x | bash -; then
            echo -e "${RED}❌ فشل إعداد مستودع Node.js${NC}"
            return 1
        fi
        if ! apt-get install -y nodejs; then
            echo -e "${RED}❌ فشل تثبيت Node.js${NC}"
            return 1
        fi
    fi
    
    # التحقق من وجود PM2
    if command -v pm2 &> /dev/null; then
        echo -e "${GREEN}✅ PM2 مثبت بالفعل${NC}"
    else
        echo -e "${YELLOW}⏳ تثبيت PM2...${NC}"
        if ! npm install -g pm2; then
            echo -e "${RED}❌ فشل تثبيت PM2${NC}"
            return 1
        fi
        
        # تكوين PM2 للتشغيل عند بدء النظام
        pm2 startup
        
        echo -e "${GREEN}✅ تم تثبيت PM2 بنجاح${NC}"
    fi
}

# تثبيت كامل مع SSL
install_full() {
    require_root
    echo -e "${BLUE}🚀 تثبيت كامل لـ WhatsApp Manager...${NC}"
    
    # طلب معلومات الدومين
    read -p "أدخل اسم الدومين (مثال: wa.example.com) [wa-api.developments.world]: " DOMAIN_NAME
    DOMAIN_NAME=${DOMAIN_NAME:-wa-api.developments.world}
    read -p "أدخل البريد الإلكتروني (لشهادة SSL) [info@wa-api.developments.world]: " EMAIL
    EMAIL=${EMAIL:-info@wa-api.developments.world}
    
    # تثبيت Docker
    install_docker
    
    # تثبيت Certbot
    echo -e "${YELLOW}⏳ تثبيت Certbot...${NC}"
    apt-get update
    apt-get install -y certbot
    
    # إنشاء المجلدات
    mkdir -p $DEFAULT_PATH
    mkdir -p $DEFAULT_PATH/data
    mkdir -p $DEFAULT_PATH/logs
    # Ensure correct permissions for database and log directories
    chown -R 1001:1001 $DEFAULT_PATH/data $DEFAULT_PATH/logs
    mkdir -p $DEFAULT_PATH/ssl
    
    # نسخ الملفات
    cp -a "$SCRIPT_DIR"/. "$DEFAULT_PATH/"
    cd "$DEFAULT_PATH"
    fix_permissions
    
    # إنشاء ملف .env
    cat > $DEFAULT_PATH/.env << EOL
# إعدادات الخادم
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
DOMAIN_NAME=${DOMAIN_NAME}

# إعدادات قاعدة البيانات
DATABASE_PATH=/app/data/whatsapp_manager.db

# إعدادات المصادقة
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# بيانات الإدارة الافتراضية
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# إعدادات الأمان
MAX_AUTH_ATTEMPTS=5
RATE_LIMIT_MAX_REQUESTS=100

# إعدادات WebSocket
ENABLE_WEBSOCKET=true
WEBSOCKET_PORT=3001
NEXT_PUBLIC_WEBSOCKET_URL=wss://${DOMAIN_NAME}/ws/socket.io

# إعدادات CORS
CORS_ORIGIN=https://${DOMAIN_NAME}

# إعدادات السجلات
LOG_LEVEL=debug

# إعدادات Puppeteer (استخدم المسار الافتراضي للمتصفح المدمج)

# إعدادات الدومين
NEXT_PUBLIC_DOMAIN_NAME=${DOMAIN_NAME}
NEXT_PUBLIC_WHATSAPP_API_URL=https://${DOMAIN_NAME}/api
FRONTEND_URL=https://${DOMAIN_NAME}
EOL
    
    # إنشاء ملف nginx.conf
    cat > $DEFAULT_PATH/nginx.conf << EOL
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    keepalive_timeout 65;
    
    # GZIP
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    
    server {
        listen 80;
        server_name ${DOMAIN_NAME};
        
        location / {
            return 301 https://\$host\$request_uri;
        }
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
    }
    
    server {
        listen 443 ssl;
        server_name ${DOMAIN_NAME};
        
        ssl_certificate /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem;
        
        location / {
            proxy_pass http://whatsapp-manager:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_cache_bypass \$http_upgrade;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # WebSocket endpoint (preferred path)
        location /ws/socket.io/ {
            proxy_pass http://whatsapp-manager:3001/socket.io/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_read_timeout 86400;
        }

        # Fallback for clients using the default Socket.IO path
        location /socket.io/ {
            proxy_pass http://whatsapp-manager:3001/socket.io/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_read_timeout 86400;
        }
    }
}
EOL
    
    # تحديث docker-compose.yml
    cat > $DEFAULT_PATH/docker-compose.yml << EOL
version: '3.8'

services:
  whatsapp-manager:
    build: .
    image: whatsapp-manager:latest
    container_name: whatsapp-manager
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
      - "127.0.0.1:3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/app/data/whatsapp_manager.db
      - ADMIN_USERNAME=\${ADMIN_USERNAME:-admin}
      - ADMIN_PASSWORD=\${ADMIN_PASSWORD:-admin123}
      - JWT_SECRET=\${JWT_SECRET}
      - MAX_AUTH_ATTEMPTS=\${MAX_AUTH_ATTEMPTS:-5}
      - JWT_EXPIRES_IN=\${JWT_EXPIRES_IN:-24h}
      - ENABLE_WEBSOCKET=\${ENABLE_WEBSOCKET:-true}
      - WEBSOCKET_PORT=\${WEBSOCKET_PORT:-3001}
      - LOG_LEVEL=\${LOG_LEVEL:-debug}
      - NEXT_PUBLIC_DOMAIN_NAME=\${NEXT_PUBLIC_DOMAIN_NAME}
      - NEXT_PUBLIC_WHATSAPP_API_URL=\${NEXT_PUBLIC_WHATSAPP_API_URL}
      - FRONTEND_URL=\${FRONTEND_URL}
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - /dev/shm:/dev/shm
    networks:
      - whatsapp-manager-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  nginx:
    image: nginx:alpine
    container_name: whatsapp-manager-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/letsencrypt
      - ./certbot-webroot:/var/www/certbot
    depends_on:
      - whatsapp-manager
    networks:
      - whatsapp-manager-network

networks:
  whatsapp-manager-network:
    name: whatsapp-manager-network
    driver: bridge
EOL
    
    # إنشاء مجلد لـ Certbot
    mkdir -p $DEFAULT_PATH/certbot-webroot
    
    # الحصول على شهادة SSL
    echo -e "${YELLOW}⏳ الحصول على شهادة SSL...${NC}"
    certbot certonly --webroot -w $DEFAULT_PATH/certbot-webroot -d $DOMAIN_NAME --email $EMAIL --agree-tos --no-eff-email
    
    # نسخ شهادات SSL
    mkdir -p $DEFAULT_PATH/ssl/live/$DOMAIN_NAME
    cp -L /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem $DEFAULT_PATH/ssl/live/$DOMAIN_NAME/
    cp -L /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem $DEFAULT_PATH/ssl/live/$DOMAIN_NAME/
    
    # تثبيت wa-manager في النظام
    install_system_command

    # تشغيل النظام
    cd $DEFAULT_PATH

    # تأكد من نظافة عملية البناء السابقة
    rm -rf .next node_modules/.cache
    $DOCKER_COMPOSE_CMD down || true
    fix_permissions
    $DOCKER_COMPOSE_CMD build --no-cache
    if $DOCKER_COMPOSE_CMD up -d; then
        echo -e "${GREEN}✅ تم تثبيت WhatsApp Manager بنجاح!${NC}"
        echo -e "${BLUE}🌐 يمكنك الوصول للنظام عبر: https://${DOMAIN_NAME}${NC}"
        echo -e "${YELLOW}👤 المستخدم: admin${NC}"
        echo -e "${YELLOW}🔑 كلمة المرور: admin123${NC}"
    else
        echo -e "${RED}❌ فشل تشغيل الحاويات عبر Docker Compose${NC}"
        exit 1
    fi
}

# تثبيت الأمر في النظام
install_system_command() {
    require_root
    echo -e "${BLUE}📦 تثبيت الأمر في النظام...${NC}"

    # نسخ السكريبت إلى /usr/local/bin
    cp $0 /usr/local/bin/wa-manager
    chmod +x /usr/local/bin/wa-manager

    echo -e "${GREEN}✅ تم تثبيت الأمر بنجاح${NC}"
    echo -e "${YELLOW}يمكنك الآن استخدام الأمر 'wa-manager' من أي مكان${NC}"
}

# تثبيت CLI فقط
install_cli() {
    install_system_command
}

# تشغيل النظام
start_system() {
    echo -e "${BLUE}🚀 تشغيل WhatsApp Manager...${NC}"

    # التحقق من المسار
    if [ -d "$DEFAULT_PATH" ]; then
        cd $DEFAULT_PATH
    fi

    # فحص وجود Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker Compose غير مثبت!${NC}"
        echo -e "${YELLOW}🔧 شغل: wa-manager install docker${NC}"
        return 1
    fi

    # فحص تشغيل Docker
    if ! systemctl is-active --quiet docker; then
        echo -e "${YELLOW}🔄 تشغيل خدمة Docker...${NC}"
        systemctl start docker
    fi

    # التحقق من وجود الملفات
    check_files || return 1

    # التحقق من متغيرات البيئة الهامة
    if [ -f ".env" ]; then
        source .env
        if [ -z "$ADMIN_USERNAME" ] || [ -z "$ADMIN_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
            echo -e "${RED}❌ يجب ضبط ADMIN_USERNAME و ADMIN_PASSWORD و JWT_SECRET في .env${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ ملف .env غير موجود${NC}"
        return 1
    fi

    # إنشاء المجلدات
    mkdir -p data logs
    fix_permissions
    
    # تشغيل Docker Compose
    $DOCKER_COMPOSE_CMD up -d
    
    # التحقق من الحالة
    sleep 5
    if $DOCKER_COMPOSE_CMD ps | grep -q "Up"; then
        echo -e "${GREEN}✅ تم تشغيل النظام بنجاح${NC}"
        
        # عرض عنوان الوصول
        if [ -f ".env" ] && grep -q "NEXT_PUBLIC_DOMAIN_NAME" .env; then
            DOMAIN=$(grep "NEXT_PUBLIC_DOMAIN_NAME" .env | cut -d '=' -f2)
            echo -e "${BLUE}🌐 يمكنك الوصول للنظام عبر: https://${DOMAIN}${NC}"
        else
            echo -e "${BLUE}🌐 يمكنك الوصول للنظام عبر: http://localhost:3000${NC}"
        fi
        
        echo -e "${YELLOW}👤 المستخدم: admin${NC}"
        echo -e "${YELLOW}🔑 كلمة المرور: admin123${NC}"
    else
        echo -e "${RED}❌ فشل في تشغيل النظام${NC}"
        echo -e "${YELLOW}📋 عرض السجلات: wa-manager logs${NC}"
    fi
}

# إيقاف النظام
stop_system() {
    echo -e "${BLUE}🛑 إيقاف WhatsApp Manager...${NC}"
    
    # التحقق من المسار
    if [ -d "$DEFAULT_PATH" ]; then
        cd $DEFAULT_PATH
    fi
    
    # إيقاف Docker Compose
    $DOCKER_COMPOSE_CMD down
    
    echo -e "${GREEN}✅ تم إيقاف النظام بنجاح${NC}"
}

# إعادة تشغيل النظام
restart_system() {
    echo -e "${BLUE}🔄 إعادة تشغيل WhatsApp Manager...${NC}"
    
    # إيقاف النظام
    stop_system
    
    # تشغيل النظام
    start_system
}

# عرض حالة النظام
show_status() {
    echo -e "${BLUE}📊 حالة WhatsApp Manager...${NC}"
    
    # التحقق من المسار
    if [ -d "$DEFAULT_PATH" ]; then
        cd $DEFAULT_PATH
    fi
    
    # عرض حالة الحاويات
    echo -e "${YELLOW}🐳 حالة الحاويات:${NC}"
    $DOCKER_COMPOSE_CMD ps
    
    echo ""
    echo -e "${YELLOW}💾 استخدام الموارد:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
    
    echo ""
    echo -e "${YELLOW}🌐 فحص الاتصال:${NC}"
    
    # التحقق من وجود دومين
    if [ -f ".env" ] && grep -q "NEXT_PUBLIC_DOMAIN_NAME" .env; then
        DOMAIN=$(grep "NEXT_PUBLIC_DOMAIN_NAME" .env | cut -d '=' -f2)
        if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/health | grep -q "200"; then
            echo -e "${GREEN}✅ النظام يعمل بشكل صحيح${NC}"
        else
            echo -e "${RED}❌ النظام لا يستجيب${NC}"
        fi
    else
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200"; then
            echo -e "${GREEN}✅ النظام يعمل بشكل صحيح${NC}"
        else
            echo -e "${RED}❌ النظام لا يستجيب${NC}"
        fi
    fi
}

# عرض سجلات النظام
show_logs() {
    echo -e "${BLUE}📋 عرض سجلات WhatsApp Manager...${NC}"
    
    # التحقق من المسار
    if [ -d "$DEFAULT_PATH" ]; then
        cd $DEFAULT_PATH
    fi
    
    # عرض السجلات
    $DOCKER_COMPOSE_CMD logs -f --tail=50
}

# تنظيف الملفات المؤقتة
clean_system() {
    echo -e "${BLUE}🧹 تنظيف الملفات المؤقتة...${NC}"
    
    # التحقق من المسار
    if [ -d "$DEFAULT_PATH" ]; then
        cd $DEFAULT_PATH
    fi
    
    # تحديد ملف البيئة لاستخدامه مع Docker Compose لتفادي التحذيرات
    if [ -f ".env" ]; then
        $DOCKER_COMPOSE_CMD --env-file .env down
    elif [ -f ".env.example" ]; then
        $DOCKER_COMPOSE_CMD --env-file .env.example down
    else
        $DOCKER_COMPOSE_CMD down
    fi
    
    # حذف الصور غير المستخدمة
    docker image prune -af
    
    # حذف الحاويات المتوقفة
    docker container prune -f
    
    # حذف الشبكات غير المستخدمة
    docker network prune -f
    
    # حذف الملفات المؤقتة
    rm -rf .next node_modules/.cache
    
    echo -e "${GREEN}✅ تم تنظيف الملفات المؤقتة بنجاح${NC}"
}

# مراقبة النظام
monitor_system() {
    echo -e "${BLUE}📊 مراقبة WhatsApp Manager...${NC}"
    
    # التحقق من المسار
    if [ -d "$DEFAULT_PATH" ]; then
        cd $DEFAULT_PATH
    fi
    
    # مراقبة الحاويات
    docker stats
}

# عرض/تعديل متغيرات البيئة
manage_env() {
    echo -e "${BLUE}🔧 إدارة متغيرات البيئة...${NC}"
    
    # التحقق من المسار
    if [ -d "$DEFAULT_PATH" ]; then
        cd $DEFAULT_PATH
    fi
    
    # التحقق من وجود ملف .env
    if [ ! -f ".env" ]; then
        echo -e "${RED}❌ ملف .env غير موجود${NC}"
        return 1
    fi
    
    # عرض متغيرات البيئة
    echo -e "${YELLOW}📋 متغيرات البيئة الحالية:${NC}"
    cat .env
    
    # سؤال المستخدم إذا كان يريد تعديل الملف
    read -p "هل تريد تعديل ملف .env؟ (y/n): " EDIT_ENV
    
    if [ "$EDIT_ENV" = "y" ] || [ "$EDIT_ENV" = "Y" ]; then
        # فتح الملف للتعديل
        if command -v nano &> /dev/null; then
            nano .env
        elif command -v vim &> /dev/null; then
            vim .env
        else
            echo -e "${RED}❌ لا يوجد محرر نصوص متاح${NC}"
            return 1
        fi
        
        echo -e "${GREEN}✅ تم تعديل ملف .env بنجاح${NC}"
        echo -e "${YELLOW}⚠️ قد تحتاج إلى إعادة تشغيل النظام لتطبيق التغييرات${NC}"
    fi
}

# إزالة النظام
uninstall_system() {
    echo -e "${BLUE}🗑️ إزالة WhatsApp Manager...${NC}"
    
    # التأكيد
    read -p "هل أنت متأكد من إزالة النظام؟ سيتم حذف جميع البيانات (y/n): " CONFIRM
    
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        echo -e "${YELLOW}⚠️ تم إلغاء العملية${NC}"
        return 0
    fi
    
    # التحقق من المسار
    if [ -d "$DEFAULT_PATH" ]; then
        cd $DEFAULT_PATH
        
        # إيقاف النظام
        $DOCKER_COMPOSE_CMD down -v
        
        # حذف الصور
        docker rmi $(docker images -q whatsapp-manager_whatsapp-manager) 2>/dev/null || true
        
        # حذف المجلد
        cd /
        rm -rf $DEFAULT_PATH
    fi
    
    # إزالة الأمر من النظام
    if [ -f "/usr/local/bin/wa-manager" ]; then
        rm /usr/local/bin/wa-manager
    fi
    
    echo -e "${GREEN}✅ تم إزالة النظام بنجاح${NC}"
}

# نسخ احتياطي لقاعدة البيانات
backup_database() {
    echo -e "${BLUE}💾 نسخ احتياطي لقاعدة البيانات...${NC}"
    
    # التحقق من المسار
    if [ -d "$DEFAULT_PATH" ]; then
        cd $DEFAULT_PATH
    fi
    
    # إنشاء مجلد النسخ الاحتياطي
    mkdir -p backups
    
    # تاريخ النسخة الاحتياطية
    BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
    
    # نسخ قاعدة البيانات
    cp data/whatsapp_manager.db backups/whatsapp_manager_$BACKUP_DATE.db
    
    echo -e "${GREEN}✅ تم إنشاء نسخة احتياطية بنجاح: backups/whatsapp_manager_$BACKUP_DATE.db${NC}"
}

# استعادة قاعدة البيانات
restore_database() {
    echo -e "${BLUE}🔄 استعادة قاعدة البيانات...${NC}"
    
    # التحقق من المسار
    if [ -d "$DEFAULT_PATH" ]; then
        cd $DEFAULT_PATH
    fi
    
    # التحقق من وجود مجلد النسخ الاحتياطي
    if [ ! -d "backups" ]; then
        echo -e "${RED}❌ مجلد النسخ الاحتياطي غير موجود${NC}"
        return 1
    fi
    
    # عرض النسخ الاحتياطية المتاحة
    echo -e "${YELLOW}📋 النسخ الاحتياطية المتاحة:${NC}"
    ls -1 backups/*.db 2>/dev/null || echo "لا توجد نسخ احتياطية"
    
    # سؤال المستخدم عن النسخة المراد استعادتها
    read -p "أدخل اسم ملف النسخة الاحتياطية: " BACKUP_FILE
    
    # التحقق من وجود الملف
    if [ ! -f "backups/$BACKUP_FILE" ]; then
        echo -e "${RED}❌ ملف النسخة الاحتياطية غير موجود${NC}"
        return 1
    fi
    
    # إيقاف النظام
    $DOCKER_COMPOSE_CMD down
    
    # نسخ احتياطي للملف الحالي
    cp data/whatsapp_manager.db data/whatsapp_manager.db.bak
    
    # استعادة النسخة الاحتياطية
    cp backups/$BACKUP_FILE data/whatsapp_manager.db
    
    # تشغيل النظام
    $DOCKER_COMPOSE_CMD up -d
    
    echo -e "${GREEN}✅ تم استعادة قاعدة البيانات بنجاح${NC}"
    echo -e "${YELLOW}⚠️ تم إنشاء نسخة احتياطية للملف الحالي: data/whatsapp_manager.db.bak${NC}"
}

# إعادة تهيئة ملف .env
rebuild_env() {
    echo -e "${BLUE}🔄 إعادة تهيئة ملف .env...${NC}"

    if [ -d "$DEFAULT_PATH" ]; then
        cd $DEFAULT_PATH
    fi

    read -p "أدخل اسم الدومين (مثال: wa.example.com) [wa-api.developments.world]: " DOMAIN_NAME
    DOMAIN_NAME=${DOMAIN_NAME:-wa-api.developments.world}
    read -p "أدخل البريد الإلكتروني (لشهادة SSL) [info@wa-api.developments.world]: " EMAIL
    EMAIL=${EMAIL:-info@wa-api.developments.world}

    cat > .env <<EOL
# إعدادات الخادم
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
DOMAIN_NAME=${DOMAIN_NAME}

# إعدادات قاعدة البيانات
DATABASE_PATH=/app/data/whatsapp_manager.db

# إعدادات المصادقة
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# بيانات الإدارة الافتراضية
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# إعدادات الأمان
MAX_AUTH_ATTEMPTS=5
RATE_LIMIT_MAX_REQUESTS=100

# إعدادات WebSocket
ENABLE_WEBSOCKET=true
WEBSOCKET_PORT=3001
NEXT_PUBLIC_WEBSOCKET_URL=wss://${DOMAIN_NAME}/ws/socket.io

# إعدادات CORS
CORS_ORIGIN=https://${DOMAIN_NAME}

# إعدادات السجلات
LOG_LEVEL=debug

# إعدادات Puppeteer

# إعدادات الدومين
NEXT_PUBLIC_DOMAIN_NAME=${DOMAIN_NAME}
NEXT_PUBLIC_WHATSAPP_API_URL=https://${DOMAIN_NAME}/api
FRONTEND_URL=https://${DOMAIN_NAME}
RESTART_POLICY=unless-stopped
EOL

    echo -e "${GREEN}✅ تم إنشاء ملف .env بنجاح${NC}"
    echo -e "${YELLOW}⏳ جلب أحدث التغييرات من المستودع...${NC}"
    git pull
    echo -e "${YELLOW}⏳ إعادة تشغيل الخدمات لتطبيق التغييرات...${NC}"
    $DOCKER_COMPOSE_CMD down
    $DOCKER_COMPOSE_CMD build
    $DOCKER_COMPOSE_CMD up -d
}

# تحديث النظام
update_system() {
    require_root
    echo -e "${BLUE}🔄 تحديث WhatsApp Manager...${NC}"
    
    # التحقق من المسار
    if [ -d "$DEFAULT_PATH" ]; then
        cd $DEFAULT_PATH
    fi
    
    # نسخ احتياطي للملفات الهامة
    echo -e "${YELLOW}⏳ نسخ احتياطي للملفات الهامة...${NC}"
    cp .env .env.bak
    cp docker-compose.yml docker-compose.yml.bak
    
    # سحب التحديثات
    echo -e "${YELLOW}⏳ سحب التحديثات...${NC}"
    git pull
    
    # إعادة بناء الصور
    echo -e "${YELLOW}⏳ إعادة بناء الصور...${NC}"
    $DOCKER_COMPOSE_CMD build --no-cache
    
    # إعادة تشغيل النظام
    echo -e "${YELLOW}⏳ إعادة تشغيل النظام...${NC}"
    $DOCKER_COMPOSE_CMD up -d
    
    echo -e "${GREEN}✅ تم تحديث النظام بنجاح${NC}"
    echo -e "${YELLOW}⚠️ تم إنشاء نسخة احتياطية للملفات الهامة: .env.bak, docker-compose.yml.bak${NC}"
}

# التحقق من وجود الأمر
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

# معالجة الأوامر
case "$1" in
    help)
        show_help
        ;;
    start)
        start_system
        ;;
    stop)
        stop_system
        ;;
    restart)
        restart_system
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    install)
        case "$2" in
            docker)
                install_docker
                ;;
            pm2)
                install_pm2
                ;;
            full)
                install_full
                ;;
            cli)
                install_cli
                ;;
            *)
                echo -e "${RED}❌ خيار تثبيت غير صالح${NC}"
                echo -e "${YELLOW}الخيارات المتاحة: docker, pm2, full, cli${NC}"
                exit 1
                ;;
        esac
        ;;
    uninstall)
        uninstall_system
        ;;
    clean)
        clean_system
        ;;
    monitor)
        monitor_system
        ;;
    env)
        manage_env
        ;;
    update)
        update_system
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database
        ;;
    rebuild)
        rebuild_env
        ;;
    *)
        echo -e "${RED}❌ أمر غير صالح: $1${NC}"
        show_help
        exit 1
        ;;
esac

exit 0
