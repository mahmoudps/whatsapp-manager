#!/bin/bash

#===============================================================================
# WhatsApp Manager - نظام إدارة متكامل ومحسن
# الإصدار: 7.5.0
# التوافق: Ubuntu 22.04/24.04 LTS
# المطور: فريق WhatsApp Manager
#===============================================================================

set -euo pipefail

#===============================================================================
# المتغيرات العامة والإعدادات
#===============================================================================

# ألوان النص
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly BOLD='\033[1m'
readonly NC='\033[0m' # No Color

# رموز الحالة
readonly SUCCESS="✅"
readonly ERROR="❌"
readonly WARNING="⚠️"
readonly INFO="ℹ️"
readonly LOADING="⏳"
readonly ROCKET="🚀"
readonly GEAR="⚙️"
readonly SHIELD="🛡️"
readonly CLEAN="🧹"
readonly BACKUP_ICON="💾" # Renamed for clarity
readonly UPDATE_ICON="🔄"

# معلومات التطبيق
readonly APP_NAME="whatsapp-manager"
readonly APP_VERSION="7.5.0" # Updated version
readonly APP_DESCRIPTION="نظام إدارة WhatsApp المتقدم والموثوق"
readonly REQUIRED_NODE_VERSION="18" # Node.js 18 or higher
readonly REQUIRED_NPM_VERSION="9"   # npm 9 or higher

# مسارات النظام
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
readonly APP_DIR="$SCRIPT_DIR" # Assuming manager.sh is in the root of the app
readonly LOG_DIR="$APP_DIR/logs"
readonly DATA_DIR="$APP_DIR/data"
readonly BACKUP_DIR="$APP_DIR/backups"
readonly SESSIONS_DIR="$DATA_DIR/sessions" # For WhatsApp Web JS sessions
readonly TEMP_DIR="$APP_DIR/tmp"

# ملفات النظام
readonly ENV_FILE="$APP_DIR/.env"
readonly DB_FILE="$DATA_DIR/database.sqlite" # Standardized DB name
readonly LOCK_FILE="$APP_DIR/.manager.lock" # More specific lock file name
readonly LOG_FILE="$LOG_DIR/manager.sh.log" # Specific log for this script

# إعدادات النظام
readonly MAX_BACKUPS=5
readonly MIN_DISK_SPACE_MB=2048 # 2GB in MB
readonly CLEANUP_DAYS_OLD_FILES=7 # Cleanup files older than 7 days
readonly MAX_LOG_SIZE_MB=50 # Max log file size in MB

#===============================================================================
# دوال المساعدة والرسائل
#===============================================================================

log_message() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    
    local color_code="$NC"
    local icon=""

    case "$level" in
        "INFO") color_code="$BLUE"; icon="$INFO" ;;
        "SUCCESS") color_code="$GREEN"; icon="$SUCCESS" ;;
        "WARNING") color_code="$YELLOW"; icon="$WARNING" ;;
        "ERROR") color_code="$RED"; icon="$ERROR" ;;
        "LOADING") color_code="$CYAN"; icon="$LOADING" ;;
    esac
    
    echo -e "${color_code}${icon} [${timestamp}]${NC} ${message}"
    
    # Ensure log directory exists before trying to write
    mkdir -p "$LOG_DIR"
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

info() { log_message "INFO" "$1"; }
success() { log_message "SUCCESS" "$1"; }
warning() { log_message "WARNING" "$1"; }
error() { log_message "ERROR" "$1"; exit 1; } # Exit on error for critical failures
loading() { log_message "LOADING" "$1"; }

# Function to ask for confirmation
confirm() {
    local prompt="$1 (y/n): "
    local response
    while true; do
        read -r -p "$(echo -e "${YELLOW}${WARNING} ${prompt}${NC}")" response
        case "$response" in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "الرجاء الإجابة بـ 'y' أو 'n'.";;
        esac
    done
}

show_progress() {
    local current=$1
    local total=$2
    local message="$3"
    local width=30 # Adjusted width
    local percentage=$((current * 100 / total))
    local filled=$((current * width / total))
    local empty=$((width - filled))
    
    # Ensure filled and empty are not negative if current > total (should not happen in normal flow)
    [[ $filled -lt 0 ]] && filled=0
    [[ $empty -lt 0 ]] && empty=0
    if (( current > total )); then
        filled=$width
        empty=0
    fi

    printf "\r${CYAN}${LOADING} ${message}${NC} ["
    # Print filled part
    for ((i=0; i<filled; i++)); do printf "#"; done
    # Print empty part
    for ((i=0; i<empty; i++)); do printf "-"; done
    printf "] ${BOLD}%d%%${NC}" "$percentage"
    
    # Add a newline when progress is complete
    if [[ $current -eq $total ]]; then
        echo
    fi
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_message "ERROR" "يجب تشغيل هذا السكريبت كمسؤول (root)."
        echo -e "${YELLOW}استخدم: ${BOLD}sudo $0 $*${NC}"
        exit 1 # Use log_message's exit for consistency
    fi
}

check_os() {
    info "فحص نظام التشغيل..."
    if [[ ! -f /etc/os-release ]]; then
        error "لا يمكن تحديد نظام التشغيل." # Critical error
    fi
    
    # shellcheck source=/dev/null
    source /etc/os-release
    
    case "$ID" in
        "ubuntu")
            if [[ "$VERSION_ID" == "24.04" || "$VERSION_ID" == "22.04" ]]; then
                success "نظام التشغيل مدعوم: $PRETTY_NAME"
                export OS_VERSION="$VERSION_ID"
            else
                warning "إصدار Ubuntu ($VERSION_ID) غير مدعوم رسمياً. قد تواجه بعض المشاكل."
                export OS_VERSION="$VERSION_ID" # Still set for package logic
            fi
            ;;
        *)
            warning "نظام التشغيل ($PRETTY_NAME) غير مدعوم رسمياً. تم تصميم هذا السكريبت لـ Ubuntu."
            # Allow to continue with a warning
            ;;
    esac
}

check_disk_space() {
    info "فحص المساحة المتوفرة على القرص..."
    local available_space_mb
    available_space_mb=$(df -m "$APP_DIR" | awk 'NR==2 {print $4}')
    
    if [[ -z "$available_space_mb" ]]; then
        warning "لا يمكن تحديد المساحة المتوفرة على القرص."
        return 0 # Non-critical, continue with warning
    fi
    
    if [[ "$available_space_mb" -lt "$MIN_DISK_SPACE_MB" ]]; then
        error "المساحة المتوفرة على القرص غير كافية. المطلوب: ${MIN_DISK_SPACE_MB}MB، المتوفر: ${available_space_mb}MB."
    fi
    
    success "المساحة المتوفرة كافية: ${available_space_mb}MB."
}

check_memory() {
    info "فحص الذاكرة المتوفرة..."
    local total_mem_mb available_mem_mb
    total_mem_mb=$(free -m | awk 'NR==2{print $2}')
    available_mem_mb=$(free -m | awk 'NR==2{print $7}') # Available memory
    
    if [[ "$total_mem_mb" -lt 1000 ]]; then # Check for at least 1GB
        warning "الذاكرة الإجمالية (${total_mem_mb}MB) قليلة. يُنصح بـ 2GB على الأقل للأداء الأمثل."
    else
        success "الذاكرة كافية: ${total_mem_mb}MB إجمالي، ${available_mem_mb}MB متوفرة."
    fi
}

#===============================================================================
# دوال إدارة الملفات والمجلدات
#===============================================================================

create_directories() {
    info "إنشاء هيكل المجلدات الأساسية..."
    local dirs=("$LOG_DIR" "$DATA_DIR" "$BACKUP_DIR" "$SESSIONS_DIR" "$TEMP_DIR")
    
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir" && loading "تم إنشاء المجلد: $dir"
        fi
    done
    
    # Set appropriate permissions
    if [[ -n "${SUDO_USER:-}" ]]; then
        chown -R "$SUDO_USER:$SUDO_USER" "$APP_DIR"
    fi
    chmod -R 750 "$APP_DIR" # More restrictive default
    chmod 700 "$SESSIONS_DIR" "$DATA_DIR" "$BACKUP_DIR" # Sensitive data
    chmod 600 "$ENV_FILE" 2>/dev/null || true # If .env exists
    
    success "تم إنشاء/التحقق من هيكل المجلدات بنجاح."
}

cleanup_temp_files() {
    info "${CLEAN} تنظيف الملفات المؤقتة والسجلات القديمة..."
    
    find "$TEMP_DIR" -type f -mtime +"$CLEANUP_DAYS_OLD_FILES" -delete 2>/dev/null || true
    
    # Rotate manager.sh.log if it's too big
    if [[ -f "$LOG_FILE" ]] && [[ $(du -m "$LOG_FILE" | cut -f1) -gt $MAX_LOG_SIZE_MB ]]; then
        mv "$LOG_FILE" "${LOG_FILE}.old"
        info "تم تدوير ملف السجل: $LOG_FILE"
    fi
    
    # Cleanup old application logs (assuming they are in $LOG_DIR and end with .log)
    find "$LOG_DIR" -name "*.log" -type f -mtime +"$CLEANUP_DAYS_OLD_FILES" -delete 2>/dev/null || true
    find "$LOG_DIR" -name "*.log.old" -type f -mtime +"$CLEANUP_DAYS_OLD_FILES" -delete 2>/dev/null || true

    # Cleanup old backups
    if [[ -d "$BACKUP_DIR" ]]; then
        ls -1t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f
    fi
    
    success "اكتمل تنظيف الملفات المؤقتة والسجلات."
}

#===============================================================================
# دوال فحص وتثبيت المتطلبات
#===============================================================================

update_system_packages() {
    info "${UPDATE_ICON} تحديث قوائم الحزم..."
    apt update -qq || warning "فشل في تحديث قوائم الحزم. قد تكون بعض الحزم قديمة."
    # Optionally, offer to upgrade packages:
    # if confirm "هل ترغب في ترقية الحزم المثبتة؟"; then
    #    info "ترقية النظام (قد يستغرق بعض الوقت)..."
    #    DEBIAN_FRONTEND=noninteractive apt upgrade -y -qq || warning "فشل في ترقية بعض الحزم."
    # fi
    success "اكتمل تحديث قوائم الحزم."
}

install_essential_packages() {
    info "${GEAR} تثبيت الحزم الأساسية..."
    
    local common_packages=(
        curl wget git unzip build-essential python3 python3-pip pkg-config
        ca-certificates gnupg software-properties-common apt-transport-https
        lsb-release xdg-utils ufw # Added ufw for firewall setup
    )
    
    # Puppeteer dependencies (common for both Ubuntu versions, with specific t64 for 24.04)
    local puppeteer_deps=(
        libasound2 libatk1.0-0 libgtk-3-0 libcairo2 libpango-1.0-0 libjpeg-dev
        libgif-dev librsvg2-bin libxi6 libxss1 libxrandr2 libgbm1 libnss3
        libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 fonts-liberation
        libappindicator3-1 libatk-bridge2.0-0 libcups2 libdrm2 libatspi2.0-0
        libxshmfence1 libxinerama1
    )

    if [[ "${OS_VERSION:-}" == "24.04" ]]; then
        # For Ubuntu 24.04, some packages have t64 suffix
        puppeteer_deps=(
            libasound2t64 libatk1.0-0t64 libgtk-3-0t64 libcairo2 libpango-1.0-0 libjpeg-dev
            libgif-dev librsvg2-bin libxi6 libxss1 libxrandr2 libgbm1 libnss3t64 # Note nss3t64
            libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 fonts-liberation
            libappindicator3-1 libatk-bridge2.0-0 libcups2 libdrm2 libatspi2.0-0
            libxshmfence1 libxinerama1
        )
    fi
    
    local all_packages=("${common_packages[@]}" "${puppeteer_deps[@]}" chromium-browser)
    
    DEBIAN_FRONTEND=noninteractive apt install -y -qq "${all_packages[@]}" || {
        warning "فشل تثبيت بعض الحزم الأساسية. حاول التثبيت اليدوي أو تحقق من اتصال الإنترنت."
        # Optionally list missing packages or provide more specific error handling
    }
    
    success "اكتمل تثبيت الحزم الأساسية."
}

install_nodejs() {
    info "${GEAR} فحص وتثبيت Node.js (الإصدار المطلوب: $REQUIRED_NODE_VERSION+)..."
    
    local current_node_major_version=""
    if command -v node &> /dev/null; then
        current_node_major_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    fi
    
    if [[ -z "$current_node_major_version" || "$current_node_major_version" -lt "$REQUIRED_NODE_VERSION" ]]; then
        info "تثبيت Node.js 20 LTS (أو أحدث متوافق)..."
        apt remove -y nodejs npm 2>/dev/null || true # Remove old versions
        # Using NodeSource for specific version
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y -qq nodejs
        
        if ! command -v node &> /dev/null; then
            error "فشل تثبيت Node.js."
        fi
        current_node_major_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1) # Re-check
    fi
    
    success "Node.js $(node -v) مثبت."
    
    info "${GEAR} فحص وتثبيت npm (الإصدار المطلوب: $REQUIRED_NPM_VERSION+)..."
    local current_npm_major_version=""
     if command -v npm &> /dev/null; then
        current_npm_major_version=$(npm -v | cut -d'.' -f1)
    fi

    if [[ -z "$current_npm_major_version" || "$current_npm_major_version" -lt "$REQUIRED_NPM_VERSION" ]]; then
        info "تحديث npm إلى أحدث إصدار..."
        npm install -g npm@latest || warning "فشل تحديث npm. قد تحتاج إلى تشغيل 'npm install -g npm@latest' يدويًا."
    fi
    success "npm $(npm -v) مثبت."
}

install_pm2() {
    info "${GEAR} فحص وتثبيت PM2 (مدير العمليات)..."
    if ! command -v pm2 &> /dev/null; then
        info "تثبيت PM2..."
        npm install -g pm2 || error "فشل تثبيت PM2."
        
        # Setup PM2 to start on boot
        # Ensure SUDO_USER is set, otherwise use current user (less ideal for system service)
        local pm2_user="${SUDO_USER:-$(whoami)}"
        local pm2_home="/home/$pm2_user"
        [[ "$pm2_user" == "root" ]] && pm2_home="/root"

        pm2 startup systemd -u "$pm2_user" --hp "$pm2_home" || warning "فشل إعداد PM2 للبدء التلقائي. يمكنك محاولة 'pm2 startup' يدويًا."
    fi
    success "PM2 $(pm2 --version) مثبت."
}

setup_puppeteer_env() {
    info "${GEAR} إعداد متغيرات البيئة لـ Puppeteer..."
    
    # These should be set in .env file for the application,
    # but setting them here ensures they are available for any script execution.
    export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
    export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
    
    # Add to .bashrc for the current user if not already present
    local target_bashrc="/home/${SUDO_USER:-$(whoami)}/.bashrc"
    if [[ -f "$target_bashrc" ]]; then
        grep -q "PUPPETEER_EXECUTABLE_PATH" "$target_bashrc" || {
            echo "" >> "$target_bashrc"
            echo "# Puppeteer environment variables for WhatsApp Manager" >> "$target_bashrc"
            echo "export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> "$target_bashrc"
            echo "export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser" >> "$target_bashrc"
            info "تمت إضافة متغيرات Puppeteer إلى $target_bashrc."
        }
    else
        warning "ملف $target_bashrc غير موجود. لم يتم تحديث متغيرات البيئة بشكل دائم."
    fi
    
    success "اكتمل إعداد متغيرات بيئة Puppeteer."
}

#===============================================================================
# دوال إدارة التبعيات والتطبيق
#===============================================================================

install_app_dependencies() {
    info "${GEAR} تثبيت تبعيات التطبيق..."
    cd "$APP_DIR" || error "لا يمكن الانتقال إلى مجلد التطبيق: $APP_DIR"
    
    if [[ ! -f "package.json" ]]; then
        error "ملف package.json غير موجود في $APP_DIR."
    fi
    
    loading "تنظيف ذاكرة التخزين المؤقت لـ npm وحذف node_modules القديمة..."
    npm cache clean --force > /dev/null 2>&1
    rm -rf node_modules package-lock.json
    
    info "محاولة تثبيت التبعيات (قد يستغرق بعض الوقت)..."
    if npm install --no-audit --no-fund --loglevel=error; then
        success "تم تثبيت تبعيات التطبيق بنجاح."
    elif npm install --legacy-peer-deps --no-audit --no-fund --loglevel=error; then
        success "تم تثبيت تبعيات التطبيق باستخدام --legacy-peer-deps."
    else
        warning "فشل التثبيت القياسي. محاولة مع --force..."
        if npm install --force --no-audit --no-fund --loglevel=error; then
            warning "تم تثبيت التبعيات باستخدام --force. قد يكون هذا غير مستقر."
        else
            error "فشل تثبيت تبعيات التطبيق حتى مع --force. تحقق من الأخطاء أعلاه."
        fi
    fi
}

build_application() {
    info "${GEAR} بناء التطبيق للإنتاج..."
    cd "$APP_DIR" || error "لا يمكن الانتقال إلى مجلد التطبيق: $APP_DIR"

    if [[ ! -f "next.config.js" && ! -f "next.config.mjs" ]]; then # Check for both .js and .mjs
        warning "ملف next.config.js أو next.config.mjs غير موجود. هل هذا مشروع Next.js؟"
    fi
    
    loading "تنظيف مجلد البناء السابق (.next)..."
    rm -rf .next
    
    info "بدء عملية البناء (npm run build)..."
    if NODE_ENV=production npm run build; then # Ensure NODE_ENV is set
        success "تم بناء التطبيق بنجاح."
    else
        error "فشل بناء التطبيق. تحقق من الأخطاء أعلاه."
    fi
}

#===============================================================================
# دوال إدارة الخدمات (PM2, Nginx, Firewall)
#===============================================================================

setup_firewall() {
    info "${SHIELD} إعداد جدار الحماية (UFW)..."
    if ! command -v ufw &> /dev/null; then
        info "تثبيت UFW..."
        apt install -y -qq ufw || error "فشل تثبيت UFW."
    fi
    
    ufw allow ssh comment "Allow SSH connections"
    ufw allow 3000/tcp comment "WhatsApp Manager App (Next.js)"
    ufw allow 3001/tcp comment "WhatsApp Manager WebSocket"
    # If using Nginx as a reverse proxy, these might be needed too
    # ufw allow 80/tcp comment "HTTP (Nginx)"
    # ufw allow 443/tcp comment "HTTPS (Nginx)"
    
    if ufw status | grep -q "Status: active"; then
        info "UFW نشط بالفعل. تم تحديث القواعد."
        ufw reload || warning "فشل إعادة تحميل قواعد UFW."
    else
        if confirm "UFW غير نشط. هل ترغب في تفعيله الآن؟ (قد يقطع الاتصالات الحالية إذا لم يتم تكوين SSH بشكل صحيح)"; then
            ufw --force enable || error "فشل تفعيل UFW."
            success "تم تفعيل UFW وإعداد القواعد."
        else
            warning "لم يتم تفعيل UFW. يرجى تفعيله يدويًا عند الحاجة."
        fi
    fi
}

setup_nginx_reverse_proxy() {
    # This is an optional step, user might not want/need Nginx
    if ! confirm "هل ترغب في إعداد Nginx كخادم وكيل عكسي (reverse proxy)؟ (مستحسن للإنتاج)"; then
        info "تم تخطي إعداد Nginx."
        return 0
    fi

    info "${GEAR} إعداد Nginx كخادم وكيل عكسي..."
    if ! command -v nginx &> /dev/null; then
        info "تثبيت Nginx..."
        apt install -y -qq nginx || error "فشل تثبيت Nginx."
    fi
    
    local nginx_conf_file="/etc/nginx/sites-available/${APP_NAME}.conf"
    info "إنشاء ملف تكوين Nginx: $nginx_conf_file"
    
    # Basic Nginx config, can be expanded for SSL, domain names etc.
    cat > "$nginx_conf_file" << EOF
server {
    listen 80;
    # listen [::]:80; # For IPv6 if needed
    # server_name your_domain.com www.your_domain.com; # Replace with your domain

    root /var/www/html; # Default root, not really used for proxy
    index index.html index.htm index.nginx-debian.html;

    access_log /var/log/nginx/${APP_NAME}.access.log;
    error_log /var/log/nginx/${APP_NAME}.error.log;

    location / {
        proxy_pass http://127.0.0.1:3000; # Assuming Next.js runs on port 3000
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400s; # 24 hours for long-polling/WebSockets
        proxy_send_timeout 86400s;
    }

    location /socket.io/ { # For WebSocket if served under /socket.io/
        proxy_pass http://127.0.0.1:3001; # Assuming WebSocket runs on port 3001
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    ln -sf "$nginx_conf_file" "/etc/nginx/sites-enabled/${APP_NAME}.conf"
    # Remove default Nginx config if it exists to avoid conflicts
    rm -f /etc/nginx/sites-enabled/default
    
    info "فحص تكوين Nginx..."
    if nginx -t; then
        info "إعادة تشغيل Nginx لتطبيق التغييرات..."
        systemctl restart nginx
        systemctl enable nginx # Ensure Nginx starts on boot
        success "تم إعداد Nginx بنجاح."
        info "يمكنك الآن الوصول إلى التطبيق عبر المنفذ 80 (أو نطاقك إذا تم تكوينه)."
    else
        error "خطأ في تكوين Nginx. يرجى مراجعة الأخطاء أعلاه والملف: $nginx_conf_file"
    fi
}

setup_pm2_service() {
    info "${GEAR} إعداد خدمة التطبيق باستخدام PM2..."
    cd "$APP_DIR" || error "لا يمكن الانتقال إلى مجلد التطبيق: $APP_DIR"

    if [[ ! -f "ecosystem.config.js" ]]; then
        warning "ملف ecosystem.config.js غير موجود. سيتم محاولة بدء 'npm start'."
        # Create a basic ecosystem file if it doesn't exist
        cat > ecosystem.config.js << EOF
module.exports = {
  apps : [{
    name   : "${APP_NAME}",
    script : "npm",
    args   : "start",
    env_production: {
       NODE_ENV: "production",
       PORT: 3000 // Make sure this matches your app's port
    },
    // Optional:
    // instances : "max", // Or a specific number of instances
    // exec_mode : "cluster",
    // watch: true, // Be careful with watch in production
    // ignore_watch : ["node_modules", "logs", "data", "backups", "tmp"],
    // max_memory_restart: '1G'
  }]
}
EOF
        info "تم إنشاء ملف ecosystem.config.js أساسي."
    fi
    
    local pm2_user="${SUDO_USER:-$(whoami)}"
    
    # Stop and delete any existing process with the same name for this user
    sudo -u "$pm2_user" pm2 delete "$APP_NAME" 2>/dev/null || true 
    
    info "بدء التطبيق مع PM2 كمستخدم: $pm2_user"
    # Run PM2 commands as the specified user to avoid permission issues with user's home directory
    if sudo -u "$pm2_user" PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser pm2 start ecosystem.config.js --env production; then
        sudo -u "$pm2_user" pm2 save # Save current process list
        success "تم بدء التطبيق وإعداده للبدء التلقائي مع PM2."
    else
        error "فشل بدء التطبيق مع PM2."
    fi
}

#===============================================================================
# دوال إدارة التطبيق (Start, Stop, Restart, Status)
#===============================================================================

start_application() {
    info "${ROCKET} بدء التطبيق..."
    if pm2_status "$APP_NAME" "online"; then
        warning "التطبيق ($APP_NAME) قيد التشغيل بالفعل."
        return 0
    fi
    
    cd "$APP_DIR" || error "لا يمكن الانتقال إلى مجلد التطبيق."
    
    if [[ ! -f "ecosystem.config.js" ]]; then
         error "ملف ecosystem.config.js مفقود. لا يمكن بدء التطبيق. قم بتشغيل 'install' أو 'setup-pm2'."
    fi

    local pm2_user="${SUDO_USER:-$(whoami)}"
    if sudo -u "$pm2_user" PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser pm2 start ecosystem.config.js --env production; then
        success "تم بدء التطبيق ($APP_NAME) بنجاح."
        echo
        info "معلومات الوصول (قد تختلف إذا كنت تستخدم Nginx):"
        echo -e "${CYAN}🔗 التطبيق الرئيسي (محلي): ${BOLD}http://localhost:3000${NC} (أو المنفذ المحدد في ecosystem.config.js)"
        echo -e "${CYAN}📊 مراقبة PM2: ${BOLD}pm2 monit${NC} (كمستخدم $pm2_user)"
        echo -e "${CYAN}📋 سجلات PM2: ${BOLD}pm2 logs $APP_NAME${NC} (كمستخدم $pm2_user)"
    else
        error "فشل بدء التطبيق ($APP_NAME) مع PM2."
    fi
}

stop_application() {
    info "🛑 إيقاف التطبيق..."
    if ! pm2_status "$APP_NAME" >/dev/null 2>&1; then # Check if process exists at all
        warning "التطبيق ($APP_NAME) غير مُدار بواسطة PM2 أو غير موجود."
        return 0
    fi

    local pm2_user="${SUDO_USER:-$(whoami)}"
    if sudo -u "$pm2_user" pm2 stop "$APP_NAME"; then
        success "تم إيقاف التطبيق ($APP_NAME) بنجاح."
    else
        # If stop fails, it might already be stopped or an error occurred
        if ! pm2_status "$APP_NAME" "online"; then
             success "التطبيق ($APP_NAME) متوقف بالفعل أو تم إيقافه."
        else
            error "فشل إيقاف التطبيق ($APP_NAME) مع PM2."
        fi
    fi
}

restart_application() {
    info "${UPDATE_ICON} إعادة تشغيل التطبيق..."
    
    cd "$APP_DIR" || error "لا يمكن الانتقال إلى مجلد التطبيق."

    if [[ ! -f "ecosystem.config.js" ]]; then
         error "ملف ecosystem.config.js مفقود. لا يمكن إعادة تشغيل التطبيق."
    fi

    local pm2_user="${SUDO_USER:-$(whoami)}"
    # Using restart which is more efficient if the process is running
    if sudo -u "$pm2_user" PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser pm2 restart "$APP_NAME" --env production; then
        success "تمت إعادة تشغيل التطبيق ($APP_NAME) بنجاح."
    else
        warning "فشلت إعادة التشغيل المباشرة. محاولة الإيقاف ثم البدء..."
        stop_application
        sleep 2 # Give it a moment to stop
        start_application
    fi
}

# Helper function to check PM2 status
# Usage: pm2_status "app_name" ["expected_status"]
# Returns 0 if process exists (and matches expected_status if provided), 1 otherwise
pm2_status() {
    local process_name="$1"
    local expected_status="${2:-}" # Optional: e.g., "online", "stopped"
    local pm2_user="${SUDO_USER:-$(whoami)}"
    
    local output
    output=$(sudo -u "$pm2_user" pm2 describe "$process_name" 2>/dev/null)
    
    if [[ -z "$output" ]]; then
        return 1 # Process does not exist
    fi
    
    if [[ -n "$expected_status" ]]; then
        # Extract status from the output (this might need adjustment based on pm2 version/output)
        # Assuming status is shown like 'status : online'
        if echo "$output" | grep -q "│ status[[:space:]]*│[[:space:]]*$expected_status[[:space:]]*│"; then
            return 0 # Process exists and matches expected status
        else
            return 1 # Process exists but status does not match
        fi
    fi
    
    return 0 # Process exists
}

show_application_status() {
    echo
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${WHITE}                    حالة WhatsApp Manager                     ${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo
    
    # System Info
    info "معلومات النظام:"
    echo -e "  ${CYAN}نظام التشغيل:${NC} $(lsb_release -ds 2>/dev/null || echo "غير معروف")"
    echo -e "  ${CYAN}المعالج:${NC} $(nproc --all 2>/dev/null || echo "غير معروف") cores"
    echo -e "  ${CYAN}الذاكرة:${NC} $(free -h | awk 'NR==2{printf "%s إجمالي، %s متوفرة", $2, $7}')"
    echo -e "  ${CYAN}مساحة القرص (/):${NC} $(df -h / | awk 'NR==2{print $4}') متوفرة"
    echo
    
    # Application Dependencies Info
    info "معلومات تبعيات التطبيق:"
    command -v node &>/dev/null && echo -e "  ${CYAN}Node.js:${NC} $(node -v)" || echo -e "  ${RED}Node.js: غير مثبت${NC}"
    command -v npm &>/dev/null && echo -e "  ${CYAN}npm:${NC} $(npm -v)" || echo -e "  ${RED}npm: غير مثبت${NC}"
    command -v pm2 &>/dev/null && echo -e "  ${CYAN}PM2:${NC} $(pm2 --version)" || echo -e "  ${RED}PM2: غير مثبت${NC}"
    command -v chromium-browser &>/dev/null && echo -e "  ${CYAN}Chromium:${NC} $(chromium-browser --version | head -n1)" || echo -e "  ${RED}Chromium: غير مثبت${NC}"
    echo
    
    # PM2 Application Status
    info "حالة التطبيق (PM2):"
    local pm2_user="${SUDO_USER:-$(whoami)}"
    if command -v pm2 &> /dev/null; then
        # sudo -u "$pm2_user" pm2 list # This can be too verbose
        if pm2_status "$APP_NAME"; then
            sudo -u "$pm2_user" pm2 describe "$APP_NAME"
        else
            echo -e "  ${YELLOW}التطبيق ($APP_NAME) غير مُدار حاليًا بواسطة PM2 أو لا يوجد.${NC}"
        fi
    else
        echo -e "  ${RED}PM2 غير مثبت. لا يمكن عرض حالة التطبيق.${NC}"
    fi
    echo
}

#===============================================================================
# دوال النسخ الاحتياطي والاستعادة
#===============================================================================

create_backup() {
    local backup_name_prefix="backup_${APP_NAME}_$(date +'%Y%m%d_%H%M%S')"
    local backup_filename="${1:-$backup_name_prefix}.tar.gz" # Allow custom name
    local backup_filepath="$BACKUP_DIR/$backup_filename"
    
    info "${BACKUP_ICON} إنشاء نسخة احتياطية: $backup_filename"
    
    check_disk_space # Ensure enough space for backup
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Remove oldest backups if MAX_BACKUPS is exceeded
    if [[ $(ls -1 "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | wc -l) -ge $MAX_BACKUPS ]]; then
        info "حذف أقدم النسخ الاحتياطية للحفاظ على الحد الأقصى ($MAX_BACKUPS)..."
        ls -1t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f
    fi
    
    info "ضغط الملفات..."
    # Backup essential parts: .env, data, relevant configs. Exclude large/generated files.
    # Assuming manager.sh is in APP_DIR. Backing up APP_DIR.
    tar -czf "$backup_filepath" \
        --exclude="node_modules" \
        --exclude=".git" \
        --exclude=".next" \
        --exclude="$BACKUP_DIR" \
        --exclude="$TEMP_DIR" \
        --exclude="$LOG_DIR/*.old" \
        --exclude="$SESSIONS_DIR/Default/Cache" \
        --exclude="$SESSIONS_DIR/Default/Code Cache" \
        --exclude="$SESSIONS_DIR/Default/GPUCache" \
        -C "$(dirname "$APP_DIR")" \
        "$(basename "$APP_DIR")"
        # The -C changes directory, so the archive paths are relative to parent of APP_DIR

    if [[ $? -eq 0 ]]; then
        success "تم إنشاء النسخة الاحتياطية بنجاح: $backup_filepath"
        info "حجم الملف: $(du -h "$backup_filepath" | cut -f1)"
    else
        # tar might have created a partial file on error, remove it
        rm -f "$backup_filepath" 
        error "فشل إنشاء النسخة الاحتياطية."
    fi
}

restore_backup() {
    list_backups
    echo
    read -r -p "$(echo -e "${YELLOW}يرجى إدخال رقم النسخة الاحتياطية للاستعادة، أو المسار الكامل للملف: ${NC}")" backup_choice

    local backup_file_to_restore=""

    # Check if input is a number (index from list)
    if [[ "$backup_choice" =~ ^[0-9]+$ ]]; then
        # Get the file path by index
        backup_file_to_restore=$(ls -1t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | sed -n "${backup_choice}p")
        if [[ -z "$backup_file_to_restore" ]]; then
            error "رقم النسخة الاحتياطية غير صالح."
        fi
    elif [[ -f "$backup_choice" ]]; then # Check if it's a direct file path
        backup_file_to_restore="$backup_choice"
    else
        error "إدخال غير صالح. يجب أن يكون رقمًا من القائمة أو مسارًا صالحًا لملف النسخة الاحتياطية."
    fi

    info "النسخة الاحتياطية المختارة للاستعادة: $backup_file_to_restore"

    if ! confirm "سيتم إيقاف التطبيق والكتابة فوق الملفات الحالية. هل أنت متأكد أنك تريد المتابعة؟"; then
        info "تم إلغاء عملية الاستعادة."
        return 1
    fi
    
    info "إيقاف التطبيق قبل الاستعادة..."
    stop_application
    
    # Optional: Create a "pre-restore" backup of the current state
    # create_backup "pre_restore_$(date +'%Y%m%d_%H%M%S')"
    
    info "بدء استعادة النسخة الاحتياطية من: $backup_file_to_restore"
    # Ensure extraction happens in the correct parent directory
    # The archive was created with paths relative to dirname "$APP_DIR"
    if tar -xzf "$backup_file_to_restore" -C "$(dirname "$APP_DIR")"; then
        success "تم استعادة الملفات من النسخة الاحتياطية بنجاح."
        
        info "إعادة تثبيت تبعيات التطبيق من النسخة المستعادة..."
        install_app_dependencies
        
        info "إعادة بناء التطبيق من النسخة المستعادة..."
        build_application
        
        info "بدء التطبيق بعد الاستعادة..."
        start_application
        success "اكتملت عملية الاستعادة بنجاح."
    else
        error "فشل استعادة النسخة الاحتياطية. قد تحتاج إلى استعادة يدوية أو من نسخة احتياطية أخرى."
        info "لم يتم بدء التطبيق بسبب فشل الاستعادة."
    fi
}

list_backups() {
    info "${BACKUP_ICON} عرض النسخ الاحتياطية المتوفرة في: $BACKUP_DIR"
    if [[ ! -d "$BACKUP_DIR" ]] || [[ -z "$(ls -A "$BACKUP_DIR"/*.tar.gz 2>/dev/null)" ]]; then
        warning "لا توجد نسخ احتياطية."
        return 1
    fi
    
    echo -e "${BOLD}${YELLOW}النسخ الاحتياطية (الأحدث أولاً):${NC}"
    local count=1
    # Sort by modification time, newest first
    for backup in $(ls -1t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null); do
        if [[ -f "$backup" ]]; then
            local filename
            filename=$(basename "$backup")
            local size
            size=$(du -h "$backup" | cut -f1)
            local date_modified
            date_modified=$(stat -c %y "$backup" | cut -d'.' -f1) # Human-readable date
            echo -e "  ${GREEN}${count})${NC} ${filename} (${CYAN}${size}${NC}) - ${PURPLE}${date_modified}${NC}"
            ((count++))
        fi
    done
    [[ $count -eq 1 ]] && warning "لم يتم العثور على ملفات نسخ احتياطية صالحة."
}

#===============================================================================
# دوال التشخيص والصيانة
#===============================================================================

run_diagnostics() {
    echo
    echo -e "${BOLD}${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${WHITE}                      ${GEAR} تشخيص النظام الشامل                     ${NC}"
    echo -e "${BOLD}${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo
    
    local issues_found=0
    
    # Helper for diagnostic checks
    check_item() {
        local item_name="$1"
        local check_command="$2" # Command to execute for check
        local success_message="$3"
        local failure_message="$4"
        local is_critical="${5:-false}" # Is this a critical failure?

        info "فحص: $item_name..."
        if eval "$check_command"; then
            echo -e "  ${GREEN}${SUCCESS} $success_message${NC}"
        else
            if [[ "$is_critical" == "true" ]]; then
                echo -e "  ${RED}${ERROR} $failure_message${NC}"
                ((issues_found++))
            else
                echo -e "  ${YELLOW}${WARNING} $failure_message${NC}"
            fi
        fi
    }

    check_os # Already defined, just call it
    check_disk_space
    check_memory

    check_item "Node.js" "command -v node &>/dev/null && [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -ge $REQUIRED_NODE_VERSION ]]" "Node.js $(node -v) مثبت ومتوافق." "Node.js غير مثبت أو الإصدار أقدم من $REQUIRED_NODE_VERSION." true
    check_item "npm" "command -v npm &>/dev/null && [[ $(npm -v | cut -d'.' -f1) -ge $REQUIRED_NPM_VERSION ]]" "npm $(npm -v) مثبت ومتوافق." "npm غير مثبت أو الإصدار أقدم من $REQUIRED_NPM_VERSION." true
    check_item "PM2" "command -v pm2 &>/dev/null" "PM2 $(pm2 --version) مثبت." "PM2 غير مثبت." false # Not strictly critical for app to exist, but for management
    check_item "Chromium Browser" "command -v chromium-browser &>/dev/null" "Chromium Browser مثبت." "Chromium Browser غير مثبت (مطلوب لـ Puppeteer)." true
    check_item "PUPPETEER_EXECUTABLE_PATH" "[[ -n \"${PUPPETEER_EXECUTABLE_PATH:-}\" && -x \"$PUPPETEER_EXECUTABLE_PATH\" ]]" "PUPPETEER_EXECUTABLE_PATH مُعيّن إلى ($PUPPETEER_EXECUTABLE_PATH) وقابل للتنفيذ." "PUPPETEER_EXECUTABLE_PATH غير مُعيّن أو المسار غير صالح." false

    info "فحص ملفات ومجلدات التطبيق الأساسية..."
    check_item "package.json" "[[ -f \"$APP_DIR/package.json\" ]]" "ملف package.json موجود." "ملف package.json مفقود." true
    check_item "ecosystem.config.js" "[[ -f \"$APP_DIR/ecosystem.config.js\" ]]" "ملف ecosystem.config.js موجود." "ملف ecosystem.config.js مفقود (مطلوب لـ PM2)." false
    check_item "مجلد البيانات ($DATA_DIR)" "[[ -d \"$DATA_DIR\" ]]" "مجلد البيانات موجود." "مجلد البيانات مفقود." false
    check_item "مجلد الجلسات ($SESSIONS_DIR)" "[[ -d \"$SESSIONS_DIR\" ]]" "مجلد الجلسات موجود." "مجلد الجلسات مفقود." false
    check_item "ملف .env" "[[ -f \"$ENV_FILE\" ]]" "ملف .env موجود." "ملف .env مفقود (قد يستخدم التطبيق القيم الافتراضية)." false


    info "فحص المنافذ المستخدمة (تقريبي)..."
    local ports_to_check=("3000" "3001") # App port, WebSocket port
    for port in "${ports_to_check[@]}"; do
        if ss -tuln | grep -q ":$port[[:space:]]" ; then # More reliable than netstat for checking listening ports
            echo -e "  ${YELLOW}${WARNING} المنفذ $port قيد الاستخدام حاليًا.${NC}"
        else
            echo -e "  ${GREEN}${SUCCESS} المنفذ $port يبدو متاحًا.${NC}"
        fi
    done
    
    echo
    if [[ $issues_found -eq 0 ]]; then
        success "${BOLD}اكتمل التشخيص - لم يتم العثور على مشاكل حرجة.${NC}"
    else
        error "${BOLD}تم العثور على $issues_found مشكلة حرجة. يرجى مراجعة السجلات أعلاه.${NC}"
    fi
    echo
}

cleanup_system_full() {
    if ! confirm "سيقوم هذا بتنظيف ذاكرة التخزين المؤقت للنظام والتطبيق، والملفات المؤقتة، والسجلات القديمة. هل أنت متأكد؟"; then
        info "تم إلغاء عملية التنظيف الشامل."
        return 1
    fi

    info "${CLEAN} بدء التنظيف الشامل للنظام..."
    
    loading "تنظيف ذاكرة التخزين المؤقت لـ npm..."
    npm cache clean --force > /dev/null 2>&1
    
    loading "تنظيف ذاكرة التخزين المؤقت لـ apt..."
    apt autoremove -y -qq
    apt autoclean -qq
    
    loading "تنظيف ملفات journalctl القديمة (إذا كان النظام يستخدم systemd)..."
    journalctl --vacuum-time=7d > /dev/null 2>&1 || warning "فشل تنظيف journalctl (قد لا يكون النظام يستخدم systemd أو لا توجد صلاحيات كافية)."

    cleanup_temp_files # Cleans app-specific temp files and logs
    
    success "اكتمل التنظيف الشامل للنظام."
}

#===============================================================================
# دوال إضافية (تحديث التطبيق، إدارة البيئة)
#===============================================================================

update_application_from_git() {
    if ! confirm "سيقوم هذا بسحب آخر التغييرات من Git وإعادة بناء التطبيق. تأكد من حفظ أي تغييرات محلية. هل أنت متأكد؟"; then
        info "تم إلغاء عملية تحديث التطبيق."
        return 1
    fi

    info "${UPDATE_ICON} بدء تحديث التطبيق من مستودع Git..."
    cd "$APP_DIR" || error "لا يمكن الانتقال إلى مجلد التطبيق."

    if [[ ! -d ".git" ]]; then
        error "هذا المجلد ليس مستودع Git. لا يمكن التحديث."
    fi

    loading "إيقاف التطبيق قبل التحديث..."
    stop_application
    
    loading "حفظ أي تغييرات محلية غير ملتزم بها (git stash)..."
    git stash push -m "Pre-update stash $(date +'%Y%m%d_%H%M%S')" || warning "فشل في git stash. المتابعة على أي حال..."

    loading "سحب آخر التغييرات من الفرع الحالي..."
    local current_branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    if git pull origin "$current_branch"; then
        success "تم سحب التغييرات بنجاح من الفرع: $current_branch."
        
        loading "استعادة أي تغييرات محفوظة (git stash pop)..."
        git stash pop || info "لا توجد تغييرات محفوظة لاستعادتها أو حدث تعارض (يرجى الحل يدوياً إذا لزم الأمر)."

        info "إعادة تثبيت التبعيات (قد تكون هناك تغييرات في package.json)..."
        install_app_dependencies
        
        info "إعادة بناء التطبيق..."
        build_application
        
        info "بدء التطبيق بعد التحديث..."
        start_application
        success "اكتمل تحديث التطبيق بنجاح."
    else
        error "فشل سحب التغييرات من Git. يرجى التحقق من اتصالك بالإنترنت وحالة المستودع."
        info "لم يتم بدء التطبيق بسبب فشل التحديث."
    fi
}

manage_env_file() {
    info "إدارة ملف البيئة (.env)..."
    if [[ ! -f "$ENV_FILE" ]]; then
        warning "ملف .env غير موجود."
        if [[ -f "$APP_DIR/.env.example" ]]; then
            if confirm "هل ترغب في إنشاء .env من .env.example؟"; then
                cp "$APP_DIR/.env.example" "$ENV_FILE"
                success "تم إنشاء $ENV_FILE من .env.example. يرجى تعديله بالقيم الصحيحة."
                chmod 600 "$ENV_FILE"
            fi
        else
            warning "ملف .env.example غير موجود أيضاً. لا يمكن إنشاء .env تلقائياً."
            # Optionally, create a very basic .env here
        fi
        return 0
    fi

    echo -e "${CYAN}المحتويات الحالية لملف .env (سيتم عرض المفاتيح فقط):${NC}"
    grep -v '^\s*#' "$ENV_FILE" | grep -v '^\s*$' | cut -d'=' -f1 | sed 's/^/  - /'
    echo
    if confirm "هل ترغب في تعديل ملف .env الآن؟ (سيتم فتحه في محرر nano)"; then
        if command -v nano &>/dev/null; then
            nano "$ENV_FILE"
            success "تم حفظ التغييرات (إذا أجريت) في $ENV_FILE."
        else
            error "محرر nano غير مثبت. يرجى تثبيته ('sudo apt install nano') أو تعديل الملف يدوياً."
        fi
    fi
}


#===============================================================================
# القائمة التفاعلية الرئيسية
#===============================================================================

show_logo() {
    clear
    echo -e "${BOLD}${CYAN}"
    cat << 'EOF'
   ╔══════════════════════════════════════════════════════════════════╗
   ║                                                                  ║
   ║    ██╗    ██╗██╗  ██╗ █████╗ ████████╗███████╗ █████╗ ██████╗    ║
   ║    ██║    ██║██║  ██║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██╔══██╗   ║
   ║    ██║ █╗ ██║███████║███████║   ██║   ███████╗███████║██████╔╝   ║
   ║    ██║███╗██║██╔══██║██╔══██║   ██║   ╚════██║██╔══██║██╔═══╝    ║
   ║    ╚███╔███╔╝██║  ██║██║  ██║   ██║   ███████║██║  ██║██║        ║
   ║     ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝        ║
   ║                                                                  ║
   ║                MANAGER - نظام الإدارة المتقدم والموثوق           ║
   ║                                                                  ║
   ╚══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo -e "${BOLD}${WHITE}                           الإصدار: $APP_VERSION${NC}"
    echo -e "${CYAN}                        $APP_DESCRIPTION${NC}"
    echo

}

show_main_menu() {
    echo -e "${BOLD}${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${WHITE}                          القائمة الرئيسية                        ${NC}"
    echo -e "${BOLD}${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo
    echo -e "${CYAN}${ROCKET} التثبيت والتحديث:${NC}"
    echo -e "  ${GREEN}1)${NC} تثبيت كامل للنظام (Setup)"
    echo -e "  ${GREEN}2)${NC} تحديث التطبيق من Git (Update App)"
    echo -e "  ${GREEN}3)${NC} تحديث حزم النظام (Update System Packages)"
    echo
    echo -e "${CYAN}${GEAR} إدارة التطبيق:${NC}"
    echo -e "  ${BLUE}4)${NC} بدء التطبيق (Start)"
    echo -e "  ${BLUE}5)${NC} إيقاف التطبيق (Stop)"
    echo -e "  ${BLUE}6)${NC} إعادة تشغيل التطبيق (Restart)"
    echo -e "  ${BLUE}7)${NC} عرض حالة التطبيق (Status)"
    echo
    echo -e "${CYAN}${SHIELD} الصيانة والتشخيص:${NC}"
    echo -e "  ${PURPLE}8)${NC} تشخيص شامل للنظام (Diagnose)"
    echo -e "  ${PURPLE}9)${NC} تنظيف النظام (Cleanup)"
    echo -e "  ${PURPLE}10)${NC} إدارة ملف البيئة .env (Manage .env)"
    echo
    echo -e "${CYAN}${BACKUP_ICON} النسخ الاحتياطي والاستعادة:${NC}"
    echo -e "  ${YELLOW}11)${NC} إنشاء نسخة احتياطية (Backup)"
    echo -e "  ${YELLOW}12)${NC} استعادة نسخة احتياطية (Restore)"
    echo -e "  ${YELLOW}13)${NC} عرض النسخ الاحتياطية (List Backups)"
    echo
    echo -e "${CYAN}${INFO} أدوات إضافية:${NC}"
    echo -e "  ${WHITE}14)${NC} عرض سجلات التطبيق (View App Logs)"
    echo -e "  ${WHITE}15)${NC} مراقبة عمليات PM2 (Monitor PM2)"
    echo
    echo -e "  ${RED}0)${NC} خروج (Exit)"
    echo
    echo -e "${BOLD}${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
}

# Function for full system setup
perform_full_installation() {
    echo
    info "${ROCKET} بدء التثبيت الكامل لـ $APP_NAME..."
    echo -e "${BOLD}${YELLOW}---------------------------------------------------------------${NC}"
    
    # Define installation steps
    local steps=(
        "فحص المتطلبات الأولية (OS, Disk, Memory)"
        "تحديث قوائم حزم النظام"
        "تثبيت الحزم الأساسية و Chromium"
        "تثبيت Node.js و npm"
        "تثبيت PM2"
        "إعداد متغيرات بيئة Puppeteer"
        "إنشاء هيكل المجلدات"
        "تثبيت تبعيات التطبيق"
        "بناء التطبيق للإنتاج"
        "إعداد جدار الحماية (UFW)"
        "إعداد خدمة التطبيق مع PM2"
        # "إعداد Nginx (اختياري)" # Made optional, called separately if chosen
    )
    local total_steps=${#steps[@]}
    
    for i in "${!steps[@]}"; do
        local current_step=$((i + 1))
        local step_name="${steps[$i]}"
        
        show_progress "$current_step" "$total_steps" "$step_name"
        
        # Execute corresponding function for each step
        case "$step_name" in
            "فحص المتطلبات الأولية (OS, Disk, Memory)") check_os && check_disk_space && check_memory ;;
            "تحديث قوائم حزم النظام") update_system_packages ;;
            "تثبيت الحزم الأساسية و Chromium") install_essential_packages ;; # Chromium is part of this now
            "تثبيت Node.js و npm") install_nodejs ;;
            "تثبيت PM2") install_pm2 ;;
            "إعداد متغيرات بيئة Puppeteer") setup_puppeteer_env ;;
            "إنشاء هيكل المجلدات") create_directories ;;
            "تثبيت تبعيات التطبيق") install_app_dependencies ;;
            "بناء التطبيق للإنتاج") build_application ;;
            "إعداد جدار الحماية (UFW)") setup_firewall ;;
            "إعداد خدمة التطبيق مع PM2") setup_pm2_service ;;
            # "إعداد Nginx (اختياري)") setup_nginx_reverse_proxy ;; # User will be prompted
        esac
        # Add a small delay for visual effect if needed, or remove if too slow
        # sleep 0.5 
    done
    
    # Optional Nginx setup after main installation
    setup_nginx_reverse_proxy

    # Final step: Start the application
    info "محاولة بدء التطبيق بعد التثبيت..."
    start_application

    echo
    success "${ROCKET} اكتمل التثبيت الكامل لـ $APP_NAME بنجاح!"
    echo -e "${GREEN}التطبيق يجب أن يكون قيد التشغيل الآن. استخدم الخيار '7' (عرض الحالة) للتحقق.${NC}"
    echo
}


interactive_menu() {
    while true; do
        show_logo
        show_main_menu
        
        local choice
        read -r -p "$(echo -e "${BOLD}${WHITE}اختر رقماً (0-15): ${NC}")" choice
        
        case "$choice" in
            1) perform_full_installation ;;
            2) update_application_from_git ;;
            3) update_system_packages ;;
            4) start_application ;;
            5) stop_application ;;
            6) restart_application ;;
            7) show_application_status ;;
            8) run_diagnostics ;;
            9) cleanup_system_full ;;
            10) manage_env_file ;;
            11) create_backup ;;
            12) restore_backup ;;
            13) list_backups ;;
            14) 
                info "عرض آخر 100 سطر من سجلات التطبيق (PM2)..."
                local pm2_user="${SUDO_USER:-$(whoami)}"
                sudo -u "$pm2_user" pm2 logs "$APP_NAME" --lines 100
                ;;
            15) 
                info "فتح شاشة مراقبة PM2..."
                local pm2_user="${SUDO_USER:-$(whoami)}"
                sudo -u "$pm2_user" pm2 monit 
                ;;
            0)
                echo
                success "شكراً لاستخدام $APP_NAME! إلى اللقاء."
                echo
                exit 0
                ;;
            *)
                warning "خيار غير صحيح. يرجى المحاولة مرة أخرى."
                ;;
        esac
        # Pause after each action before re-displaying the menu
        if [[ "$choice" != "0" ]]; then # Don't pause if exiting
             echo
             read -r -p "$(echo -e "${CYAN}اضغط Enter للعودة إلى القائمة الرئيسية...${NC}")"
        fi
    done
}

#===============================================================================
# معالجة الأوامر من سطر الأوامر (CLI)
#===============================================================================

show_help() {
    # Logo is displayed by main execution flow if no args
    echo -e "${BOLD}${CYAN}$APP_NAME - $APP_DESCRIPTION (الإصدار: $APP_VERSION)${NC}"
    echo -e "${BOLD}${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
    echo
    echo -e "${BOLD}الاستخدام:${NC} sudo $0 [الأمر] [الخيارات]"
    echo
    echo -e "${BOLD}الأوامر المتوفرة:${NC}"
    echo
    echo -e "  ${GREEN}install${NC}         تثبيت كامل للنظام وتكوينه."
    echo -e "  ${GREEN}update-app${NC}      تحديث التطبيق من مستودع Git."
    echo -e "  ${GREEN}update-sys${NC}      تحديث حزم النظام."
    echo
    echo -e "  ${BLUE}start${NC}           بدء تشغيل التطبيق."
    echo -e "  ${BLUE}stop${NC}            إيقاف تشغيل التطبيق."
    echo -e "  ${BLUE}restart${NC}         إعادة تشغيل التطبيق."
    echo -e "  ${BLUE}status${NC}          عرض حالة التطبيق والنظام."
    echo
    echo -e "  ${PURPLE}diagnose${NC}        تشخيص شامل للنظام والتطبيق."
    echo -e "  ${PURPLE}cleanup${NC}         تنظيف النظام والتطبيق (ملفات مؤقتة، سجلات قديمة)."
    echo -e "  ${PURPLE}env${NC}             إدارة ملف البيئة .env."
    echo
    echo -e "  ${YELLOW}backup${NC}          [اسم_اختياري] إنشاء نسخة احتياطية."
    echo -e "  ${YELLOW}restore${NC}         استعادة نسخة احتياطية (سيتم عرض قائمة)."
    echo -e "  ${YELLOW}list-backups${NC}   عرض النسخ الاحتياطية المتوفرة."
    echo
    echo -e "  ${WHITE}logs${NC}            [app|pm2|nginx|sys] عرض أنواع مختلفة من السجلات."
    echo -e "  ${WHITE}monit${NC}           مراقبة عمليات PM2 بشكل تفاعلي."
    echo
    echo -e "  ${RED}menu${NC}            عرض القائمة التفاعلية (الافتراضي إذا لم يتم تمرير أي أمر)."
    echo -e "  ${RED}help${NC}            عرض رسالة المساعدة هذه."
    echo
    echo -e "${BOLD}أمثلة:${NC}"
    echo -e "  sudo $0 install"
    echo -e "  sudo $0 start"
    echo -e "  sudo $0 backup my_special_backup"
    echo -e "  sudo $0 logs app"
}

#===============================================================================
# تنظيف عند الخروج غير المتوقع
#===============================================================================

cleanup_on_script_exit() {
    # This is a general cleanup for the script itself, not the application
    # For example, remove temporary files created BY THIS SCRIPT if any.
    # The application's .lock file is managed by start/stop functions.
    : # Placeholder, add script-specific temp file cleanup if needed
}

trap cleanup_on_script_exit EXIT INT TERM

#===============================================================================
# النقطة الرئيسية للتنفيذ
#===============================================================================

main() {
    check_root # Ensure script is run as root

    # Create essential directories if they don't exist, early in the script
    create_directories

    # Handle command-line arguments
    # If no arguments are passed, default to 'menu'
    local command_to_run="${1:-menu}"
    
    case "$command_to_run" in
        install) perform_full_installation ;;
        update-app) update_application_from_git ;;
        update-sys) update_system_packages ;;
        start) start_application ;;
        stop) stop_application ;;
        restart) restart_application ;;
        status) show_application_status ;;
        diagnose) run_diagnostics ;;
        cleanup) cleanup_system_full ;;
        env) manage_env_file ;;
        backup) create_backup "$2" ;; # $2 is optional backup name
        restore) restore_backup ;; # Restore will prompt for file
        list-backups) list_backups ;;
        logs) 
            local log_type="${2:-app}" # Default to app logs
            case "$log_type" in
                app|pm2) sudo -u "${SUDO_USER:-$(whoami)}" pm2 logs "$APP_NAME" --lines 100 ;;
                nginx) 
                    if [[ -f "/var/log/nginx/${APP_NAME}.access.log" ]]; then
                        tail -f "/var/log/nginx/${APP_NAME}.access.log" "/var/log/nginx/${APP_NAME}.error.log"
                    elif [[ -f "/var/log/nginx/access.log" ]]; then
                         tail -f /var/log/nginx/access.log /var/log/nginx/error.log
                    else
                        warning "لم يتم العثور على ملفات سجل Nginx."
                    fi
                    ;;
                sys) journalctl -u "${APP_NAME}.service" -f -n 100 || journalctl -f -n 100 ;;
                *) warning "نوع السجل غير معروف: $log_type. الأنواع المتاحة: app, pm2, nginx, sys." ;;
            esac
            ;;
        monit) 
            local pm2_user="${SUDO_USER:-$(whoami)}"
            sudo -u "$pm2_user" pm2 monit 
            ;;
        menu) 
            interactive_menu 
            ;;
        help|--help|-h) 
            show_logo # Show logo before help
            show_help 
            ;;
        *)
            show_logo # Show logo for unknown command too
            error "أمر غير معروف: $command_to_run"
            show_help
            exit 1
            ;;
    esac
    exit 0
}

# Execute the main function
main "$@"
