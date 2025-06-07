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
# المسار الحالي
CURRENT_PATH=$(pwd)

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
    echo -e "  ${GREEN}install${NC}     تثبيت النظام (docker|pm2|full)"
    echo -e "  ${GREEN}uninstall${NC}   إزالة النظام"
    echo -e "  ${GREEN}clean${NC}       تنظيف الملفات المؤقتة"
    echo -e "  ${GREEN}monitor${NC}     مراقبة النظام"
    echo -e "  ${GREEN}env${NC}         عرض/تعديل متغيرات البيئة"
    echo -e "  ${GREEN}update${NC}      تحديث النظام"
    echo -e "  ${GREEN}backup${NC}      نسخ احتياطي لقاعدة البيانات"
    echo -e "  ${GREEN}restore${NC}     استعادة قاعدة البيانات"
    echo ""
    echo -e "${YELLOW}أمثلة:${NC}"
    echo -e "  ${CYAN}wa-manager install docker${NC}    تثبيت Docker و Docker Compose"
    echo -e "  ${CYAN}wa-manager install full${NC}      تثبيت كامل مع دعم SSL"
    echo -e "  ${CYAN}wa-manager start${NC}             تشغيل النظام"
    echo -e "  ${CYAN}wa-manager env${NC}               عرض متغيرات البيئة"
}

# تثبيت Docker و Docker Compose
install_docker() {
    echo -e "${BLUE}🐳 تثبيت Docker و Docker Compose...${NC}"
    
    # التحقق من وجود Docker
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✅ Docker مثبت بالفعل${NC}"
    else
        echo -e "${YELLOW}⏳ تثبيت Docker...${NC}"
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
        
        # تمكين وتشغيل Docker
        systemctl enable docker
        systemctl start docker
        
        # إضافة المستخدم الحالي إلى مجموعة docker
        usermod -aG docker $USER
        
        echo -e "${GREEN}✅ تم تثبيت Docker بنجاح${NC}"
    fi
    
    # التحقق من وجود Docker Compose
    if command -v docker-compose &> /dev/null; then
        echo -e "${GREEN}✅ Docker Compose مثبت بالفعل${NC}"
    else
        echo -e "${YELLOW}⏳ تثبيت Docker Compose...${NC}"
        
        # تثبيت Docker Compose
        curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        
        echo -e "${GREEN}✅ تم تثبيت Docker Compose بنجاح${NC}"
    fi
}

# تثبيت PM2
install_pm2() {
    echo -e "${BLUE}📦 تثبيت PM2...${NC}"
    
    # التحقق من وجود Node.js و npm
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}⏳ تثبيت Node.js...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi
    
    # التحقق من وجود PM2
    if command -v pm2 &> /dev/null; then
        echo -e "${GREEN}✅ PM2 مثبت بالفعل${NC}"
    else
        echo -e "${YELLOW}⏳ تثبيت PM2...${NC}"
        npm install -g pm2
        
        # تكوين PM2 للتشغيل عند بدء النظام
        pm2 startup
        
        echo -e "${GREEN}✅ تم تثبيت PM2 بنجاح${NC}"
    fi
}

# تثبيت كامل مع SSL
install_full() {
    echo -e "${BLUE}🚀 تثبيت كامل لـ WhatsApp Manager...${NC}"
    
    # طلب معلومات الدومين
    read -p "أدخل اسم الدومين (مثال: wa.example.com): " DOMAIN_NAME
    read -p "أدخل البريد الإلكتروني (لشهادة SSL): " EMAIL
    
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
    mkdir -p $DEFAULT_PATH/ssl
    
    # نسخ الملفات
    cp -r $CURRENT_PATH/* $DEFAULT_PATH/
    
    # إنشاء ملف .env
    cat > $DEFAULT_PATH/.env << EOL
# إعدادات الخادم
PORT=3000
HOST=localhost
NODE_ENV=production

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
NEXT_PUBLIC_WEBSOCKET_URL=wss://${DOMAIN_NAME}/ws

# إعدادات CORS
CORS_ORIGIN=https://${DOMAIN_NAME}

# إعدادات السجلات
LOG_LEVEL=info

# إعدادات Puppeteer
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

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
        
        location /ws {
            proxy_pass http://whatsapp-manager:3001;
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
      - PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
      - PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
      - MAX_AUTH_ATTEMPTS=\${MAX_AUTH_ATTEMPTS:-5}
      - JWT_EXPIRES_IN=\${JWT_EXPIRES_IN:-24h}
      - ENABLE_WEBSOCKET=\${ENABLE_WEBSOCKET:-true}
      - WEBSOCKET_PORT=\${WEBSOCKET_PORT:-3001}
      - LOG_LEVEL=\${LOG_LEVEL:-info}
      - NEXT_PUBLIC_DOMAIN_NAME=\${NEXT_PUBLIC_DOMAIN_NAME}
      - NEXT_PUBLIC_WHATSAPP_API_URL=\${NEXT_PUBLIC_WHATSAPP_API_URL}
      - FRONTEND_URL=\${FRONTEND_URL}
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - /dev/shm:/dev/shm
    networks:
      - whatsapp-network
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
      - whatsapp-network

networks:
  whatsapp-network:
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
    docker-compose up -d
    
    echo -e "${GREEN}✅ تم تثبيت WhatsApp Manager بنجاح!${NC}"
    echo -e "${BLUE}🌐 يمكنك الوصول للنظام عبر: https://${DOMAIN_NAME}${NC}"
    echo -e "${YELLOW}👤 المستخدم: admin${NC}"
    echo -e "${YELLOW}🔑 كلمة المرور: admin123${NC}"
}

# تثبيت الأمر في النظام
install_system_command() {
    echo -e "${BLUE}📦 تثبيت الأمر في النظام...${NC}"
    
    # نسخ السكريبت إلى /usr/local/bin
    cp $0 /usr/local/bin/wa-manager
    chmod +x /usr/local/bin/wa-manager
    
    echo -e "${GREEN}✅ تم تثبيت الأمر بنجاح${NC}"
    echo -e "${YELLOW}يمكنك الآن استخدام الأمر 'wa-manager' من أي مكان${NC}"
}

# تشغيل النظام
start_system() {
    echo -e "${BLUE}🚀 تشغيل WhatsApp Manager...${NC}"
    
    # التحقق من المسار
    if [ -d "$DEFAULT_PATH" ]; then
        cd $DEFAULT_PATH
    fi
    
    # التحقق من وجود الملفات
    check_files || return 1
    
    # إنشاء المجلدات
    mkdir -p data logs
    
    # تشغيل Docker Compose
    docker-compose up -d
    
    # التحقق من الحالة
    sleep 5
    if docker-compose ps | grep -q "Up"; then
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
    docker-compose down
    
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
    docker-compose ps
    
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
    docker-compose logs -f --tail=50
}

# تنظيف الملفات المؤقتة
clean_system() {
    echo -e "${BLUE}🧹 تنظيف الملفات المؤقتة...${NC}"
    
    # التحقق من المسار
    if [ -d "$DEFAULT_PATH" ]; then
        cd $DEFAULT_PATH
    fi
    
    # إيقاف النظام
    docker-compose down
    
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
        docker-compose down -v
        
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
    docker-compose down
    
    # نسخ احتياطي للملف الحالي
    cp data/whatsapp_manager.db data/whatsapp_manager.db.bak
    
    # استعادة النسخة الاحتياطية
    cp backups/$BACKUP_FILE data/whatsapp_manager.db
    
    # تشغيل النظام
    docker-compose up -d
    
    echo -e "${GREEN}✅ تم استعادة قاعدة البيانات بنجاح${NC}"
    echo -e "${YELLOW}⚠️ تم إنشاء نسخة احتياطية للملف الحالي: data/whatsapp_manager.db.bak${NC}"
}

# تحديث النظام
update_system() {
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
    docker-compose build --no-cache
    
    # إعادة تشغيل النظام
    echo -e "${YELLOW}⏳ إعادة تشغيل النظام...${NC}"
    docker-compose up -d
    
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
            *)
                echo -e "${RED}❌ خيار تثبيت غير صالح${NC}"
                echo -e "${YELLOW}الخيارات المتاحة: docker, pm2, full${NC}"
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
    *)
        echo -e "${RED}❌ أمر غير صالح: $1${NC}"
        show_help
        exit 1
        ;;
esac

exit 0
