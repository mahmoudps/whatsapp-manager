# WhatsApp Manager

نظام إدارة WhatsApp باستخدام Docker

## التثبيت والتشغيل

### التثبيت السريع
\`\`\`bash
# تحميل المشروع
git clone <repository-url>
cd whatsapp-manager

# تشغيل التثبيت التلقائي
chmod +x install.sh
./install.sh
\`\`\`

### التشغيل اليدوي
\`\`\`bash
# إعطاء صلاحيات
chmod +x *.sh

# تشغيل النظام
./start.sh

# عرض السجلات
./logs.sh

# إيقاف النظام
./stop.sh
\`\`\`

## الوصول للنظام

- **URL**: http://localhost:3000
- **المستخدم**: admin
- **كلمة المرور**: admin123

## المتطلبات

- Docker
- Docker Compose

## الأوامر المفيدة

\`\`\`bash
# عرض حالة الحاويات
docker-compose ps

# إعادة بناء الصورة
docker-compose build --no-cache

# إعادة تشغيل خدمة معينة
docker-compose restart whatsapp-manager

# دخول للحاوية
docker-compose exec whatsapp-manager sh
\`\`\`

## استكشاف الأخطاء

\`\`\`bash
# عرض السجلات
docker-compose logs -f

# فحص حالة الخدمة
docker-compose ps

# إعادة تشغيل كامل
docker-compose down && docker-compose up -d
\`\`\`
\`\`\`

\`\`\`plaintext file=".gitignore"
# Dependencies
node_modules/
npm-debug.log*

# Next.js
.next/
out/

# Environment
.env*

# Database & Logs
data/
logs/
*.db

# Docker
.dockerignore

# OS
.DS_Store
Thumbs.db

# Temporary
*.tmp
*.temp
