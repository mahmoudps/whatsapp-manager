#!/bin/bash

#===============================================================================
# WhatsApp Manager - سكريبت الديبلوي المحسن
# الإصدار: 8.0.0
# التوافق: Ubuntu 22.04/24.04 LTS
#===============================================================================

set -euo pipefail

# ألوان النص
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# رموز الحالة
readonly SUCCESS="✅"
readonly ERROR="❌"
readonly WARNING="⚠️"
readonly INFO="ℹ️"
readonly LOADING="⏳"
readonly ROCKET="🚀"

# معلومات التطبيق
readonly APP_NAME="whatsapp-manager"
readonly APP_VERSION="8.0.0"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

# متغيرات الديبلوي
DEPLOY_TYPE="production"
USE_DOCKER="false"
USE_PM2="true"
SKIP_TESTS="false"
BACKUP_BEFORE_DEPLOY="true"

# دوال المساعدة
log_info() {
    echo -e "${INFO} ${BLUE}$1${NC}"
}

log_success() {
    echo -e "${SUCCESS} ${GREEN}$1${NC}"
}

log_warning() {
    echo -e "${WARNING} ${YELLOW}$1${NC}"
}

log_error() {
    echo -e "${ERROR} ${RED}$1${NC}"
}

log_loading() {
    echo -e "${LOADING} ${CYAN}$1${NC}"
}

# التحقق من تعيين متغير JWT_SECRET عند النشر للإنتاج
check_jwt_secret() {
    if [ "$DEPLOY_TYPE" = "production" ]; then
        local jwt_value="${JWT_SECRET:-}"
        if [ -z "$jwt_value" ] && [ -f ".env" ]; then
            jwt_value=$(grep -E '^JWT_SECRET=' .env | cut -d '=' -f2-)
        fi
        if [ -z "$jwt_value" ]; then
            log_error "JWT_SECRET غير معرف. الرجاء إضافته إلى ملف .env أو ضبطه كمتغير نظام قبل المتابعة."
            exit 1
        fi
    fi
}

# فحص المتطلبات
check_requirements() {
    log_info "فحص المتطلبات الأساسية..."
    
    # فحص Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js غير مثبت"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        log_error "يتطلب Node.js الإصدار 18 أو أحدث"
        exit 1
    fi
    
    # فحص npm
    if ! command -v npm &> /dev/null; then
        log_error "npm غير مثبت"
        exit 1
    fi
    
    # فحص PM2 إذا كان مطلوباً
    if [ "$USE_PM2" = "true" ] && ! command -v pm2 &> /dev/null; then
        log_warning "PM2 غير مثبت، سيتم تثبيته..."
        npm install -g pm2
    fi
    
    # فحص Docker إذا كان مطلوباً
    if [ "$USE_DOCKER" = "true" ] && ! command -v docker &> /dev/null; then
        log_error "Docker غير مثبت"
        exit 1
    fi
    
    # فحص Chromium
    if ! command -v chromium-browser &> /dev/null; then
        log_warning "Chromium غير مثبت، سيتم تثبيته..."
        sudo apt update && sudo apt install -y chromium-browser
    fi
    
    # فحص SQLite
    if ! command -v sqlite3 &> /dev/null; then
        log_warning "SQLite غير مثبت، سيتم تثبيته..."
        sudo apt update && sudo apt install -y sqlite3
    fi
    
    log_success "جميع المتطلبات متوفرة"
}

# إنشاء نسخة احتياطية
create_backup() {
    if [ "$BACKUP_BEFORE_DEPLOY" = "true" ]; then
        log_loading "إنشاء نسخة احتياطية..."
        
        local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        
        # نسخ قاعدة البيانات
        if [ -f "data/whatsapp_manager.db" ]; then
            cp "data/whatsapp_manager.db" "$backup_dir/"
        fi
        
        # نسخ جلسات WhatsApp
        if [ -d "data/whatsapp_sessions" ]; then
            cp -r "data/whatsapp_sessions" "$backup_dir/"
        fi
        
        # نسخ ملفات الإعداد
        cp .env "$backup_dir/" 2>/dev/null || true
        
        log_success "تم إنشاء النسخة الاحتياطية في: $backup_dir"
    fi
}

# تثبيت التبعيات
install_dependencies() {
    log_loading "تثبيت التبعيات..."
    
    # تنظيف التبعيات القديمة
    if [ -d "node_modules" ]; then
        rm -rf node_modules
    fi
    
    if [ -f "package-lock.json" ]; then
        rm -f package-lock.json
    fi
    
    # تثبيت التبعيات
    npm install --legacy-peer-deps
    
    log_success "تم تثبيت التبعيات بنجاح"
}

# بناء التطبيق
build_application() {
    log_loading "بناء التطبيق..."
    
    # إعداد قاعدة البيانات
    npm run setup
    
    # بناء Next.js
    npm run build
    
    log_success "تم بناء التطبيق بنجاح"
}

# تشغيل الاختبارات
run_tests() {
    if [ "$SKIP_TESTS" = "false" ]; then
        log_loading "تشغيل الاختبارات..."
        
        # تشغيل اختبارات Jest
        npm test || {
            log_warning "فشلت بعض الاختبارات، لكن سيتم المتابعة..."
        }
        
        log_success "تم تشغيل الاختبارات"
    fi
}

# ديبلوي باستخدام PM2
deploy_with_pm2() {
    log_loading "ديبلوي باستخدام PM2..."
    
    # إيقاف العمليات الحالية
    pm2 stop ecosystem.config.js 2>/dev/null || true
    
    # بدء العمليات الجديدة
    pm2 start ecosystem.config.js --env "$DEPLOY_TYPE"
    
    # حفظ قائمة العمليات
    pm2 save
    
    # إعداد بدء تلقائي
    pm2 startup || true
    
    log_success "تم الديبلوي باستخدام PM2"
}

# ديبلوي باستخدام Docker
deploy_with_docker() {
    log_loading "ديبلوي باستخدام Docker..."
    
    # إيقاف الحاويات الحالية
    docker-compose down 2>/dev/null || true
    
    # بناء وتشغيل الحاويات
    docker-compose up -d --build
    
    log_success "تم الديبلوي باستخدام Docker"
}

# فحص صحة التطبيق
health_check() {
    log_loading "فحص صحة التطبيق..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/health &>/dev/null; then
            log_success "التطبيق يعمل بشكل صحيح"
            return 0
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    log_error "فشل في فحص صحة التطبيق"
    return 1
}

# عرض معلومات ما بعد الديبلوي
show_post_deploy_info() {
    echo
    log_success "تم الديبلوي بنجاح! ${ROCKET}"
    echo
    echo -e "${BOLD}معلومات التطبيق:${NC}"
    echo -e "  ${BLUE}الاسم:${NC} $APP_NAME"
    echo -e "  ${BLUE}الإصدار:${NC} $APP_VERSION"
    echo -e "  ${BLUE}نوع الديبلوي:${NC} $DEPLOY_TYPE"
    echo
    echo -e "${BOLD}الروابط:${NC}"
    echo -e "  ${GREEN}التطبيق:${NC} http://localhost:3000"
    echo -e "  ${GREEN}WebSocket:${NC} ws://localhost:3001"
    echo -e "  ${GREEN}API Health:${NC} http://localhost:3000/api/health"
    echo
    echo -e "${BOLD}بيانات الدخول الافتراضية:${NC}"
    echo -e "  ${YELLOW}اسم المستخدم:${NC} admin"
    echo -e "  ${YELLOW}كلمة المرور:${NC} admin123"
    echo
    echo -e "${BOLD}أوامر مفيدة:${NC}"
    if [ "$USE_PM2" = "true" ]; then
        echo -e "  ${CYAN}مراقبة العمليات:${NC} pm2 monit"
        echo -e "  ${CYAN}عرض السجلات:${NC} pm2 logs"
        echo -e "  ${CYAN}إعادة تشغيل:${NC} pm2 restart ecosystem.config.js"
    fi
    if [ "$USE_DOCKER" = "true" ]; then
        echo -e "  ${CYAN}عرض الحاويات:${NC} docker-compose ps"
        echo -e "  ${CYAN}عرض السجلات:${NC} docker-compose logs -f"
        echo -e "  ${CYAN}إعادة تشغيل:${NC} docker-compose restart"
    fi
    echo
}

# عرض المساعدة
show_help() {
    echo -e "${BOLD}سكريبت ديبلوي WhatsApp Manager${NC}"
    echo
    echo -e "${BOLD}الاستخدام:${NC}"
    echo "  $0 [OPTIONS]"
    echo
    echo -e "${BOLD}الخيارات:${NC}"
    echo "  -t, --type TYPE        نوع الديبلوي (production|staging|development)"
    echo "  -d, --docker           استخدام Docker للديبلوي"
    echo "  -p, --pm2              استخدام PM2 للديبلوي (افتراضي)"
    echo "  -s, --skip-tests       تخطي الاختبارات"
    echo "  -n, --no-backup        عدم إنشاء نسخة احتياطية"
    echo "  -h, --help             عرض هذه المساعدة"
    echo
    echo -e "${BOLD}أمثلة:${NC}"
    echo "  $0                     ديبلوي production باستخدام PM2"
    echo "  $0 --docker            ديبلوي باستخدام Docker"
    echo "  $0 -t staging -s       ديبلوي staging مع تخطي الاختبارات"
}

# معالجة المعاملات
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            DEPLOY_TYPE="$2"
            shift 2
            ;;
        -d|--docker)
            USE_DOCKER="true"
            USE_PM2="false"
            shift
            ;;
        -p|--pm2)
            USE_PM2="true"
            USE_DOCKER="false"
            shift
            ;;
        -s|--skip-tests)
            SKIP_TESTS="true"
            shift
            ;;
        -n|--no-backup)
            BACKUP_BEFORE_DEPLOY="false"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "خيار غير معروف: $1"
            show_help
            exit 1
            ;;
    esac
done

# التحقق من صحة نوع الديبلوي
if [[ ! "$DEPLOY_TYPE" =~ ^(production|staging|development)$ ]]; then
    log_error "نوع ديبلوي غير صحيح: $DEPLOY_TYPE"
    exit 1
fi

# بدء عملية الديبلوي
main() {
    echo -e "${BOLD}${ROCKET} بدء ديبلوي WhatsApp Manager${NC}"
    echo -e "${BLUE}نوع الديبلوي: $DEPLOY_TYPE${NC}"
    echo -e "${BLUE}طريقة الديبلوي: $([ "$USE_DOCKER" = "true" ] && echo "Docker" || echo "PM2")${NC}"
    echo

    check_requirements
    check_jwt_secret
    create_backup
    install_dependencies
    build_application
    run_tests
    
    if [ "$USE_DOCKER" = "true" ]; then
        deploy_with_docker
    else
        deploy_with_pm2
    fi
    
    health_check
    show_post_deploy_info
}

# تشغيل السكريبت الرئيسي
main "$@"

