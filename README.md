# WhatsApp Manager

<<<<<<< HEAD
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
=======
**إصدار الحالي:** v8.0.0

نظام لإدارة رسائل واتساب عبر واجهة ويب مبني على Next.js وNode.js. يوفر إمكانية التحكم في الأجهزة والرسائل مع دعم النشر باستخدام PM2 أو Docker.

## المتطلبات

- **Node.js:** >= 18.17.0
- **npm:** >= 9.0.0
- **SQLite:** 3.37+
- **Chromium/Chrome:** للتفاعل مع واتساب ويب

## 📝 ملاحظات مهمة

1. **الأمان:** يجب تغيير اسم المستخدم وكلمة مرور المدير الافتراضيين قبل النشر.
   مثال لتعيينهما عبر متغيرات البيئة:
   ```bash
   export ADMIN_USERNAME=myadmin
   export ADMIN_PASSWORD=supersecret
   ```
2. **البيئة:** استخدم متغيرات البيئة في ملف `.env` للإعدادات الحساسة.
   عند الإعداد الأولي، انسخ الملف `.env.example` إلى `.env` ثم عدل القيم حسب الحاجة.
   يمكن تنفيذ ذلك بالأمر:
   ```bash
   cp .env.example .env
   ```
   احرص بعد النسخ على ضبط متغير **`JWT_SECRET`** في ملف `.env` أو في متغيرات النظام قبل تشغيل التطبيق،
   حيث سيتم إزالة القيمة الافتراضية قريبًا.
3. **النسخ الاحتياطي:** قم بعمل نسخ احتياطية دورية لقاعدة البيانات
4. **التحديثات:** راقب التحديثات الأمنية للمكتبات
5. **مسارات التصحيح:** إن مساري `/api/auth/test` و`/api/debug/auth` مخصصان
   للتطوير فقط ويتم تعطيلهما تلقائيًا في بيئة الإنتاج

## 🆘 الدعم والمساعدة

في حالة وجود أي مشاكل:

1. تحقق من سجلات النظام: `npm run logs`
2. أعد تشغيل النظام: `npm run restart`
3. تحقق من حالة قاعدة البيانات: `npm run db:check`
4. تنفيذ تشخيص سريع للنظام: `npm run diagnose`
- **Chromium/Chrome:** لاستخدام WhatsApp Web

## الإعداد

1. تثبيت التبعيات:
   ```bash
   npm install
   ```
2. نسخ ملف البيئة الافتراضي وتعديله:
   ```bash
   cp .env.example .env
   ```
   بعد النسخ، قم بتعديل القيم الافتراضية مثل `ADMIN_USERNAME` و`ADMIN_PASSWORD` قبل تشغيل النظام.
2. ضبط متغيرات البيئة في ملف `.env`. تأكد من تغيير القيم الافتراضية لـ`ADMIN_USERNAME` و`ADMIN_PASSWORD` قبل تشغيل النظام.
   يمكن أيضاً تعيينهما مباشرة عبر الطرفية:
   ```bash
   export ADMIN_USERNAME=myadmin
   export ADMIN_PASSWORD=supersecret
   ```
3. إنشاء قاعدة البيانات وتشغيل الإعدادات الأولية:
   ```bash
   npm run setup
   ```
   هذا الأمر يشغل سكربت `scripts/init-database.js` الذي ينشئ الجداول
   وفق المخطط الموجود في `lib/database.ts` بما في ذلك الحقول الجديدة
   مثل `updated_at` و`role` و`message_id`.

## الأوامر الأساسية

- تشغيل بيئة التطوير:
  ```bash
  npm run dev
  ```
- تشغيل الخادم في وضع الإنتاج باستخدام PM2:
  ```bash
  ./deploy.sh --pm2
  ```
- تشغيل الخادم في وضع الإنتاج باستخدام Docker:
  ```bash
  ./deploy.sh --docker
  ```
- تنفيذ الاختبارات:
  ```bash
  npm test
  ```
- **ملاحظة:** تأكد من تشغيل `npm install` قبل تنفيذ الاختبارات لضمان توفر جميع التبعيات.

## سكربت `deploy.sh`

يوفر السكربت خيارات متعددة للتحكم في عملية النشر:

- `--docker` نشر التطبيق داخل حاويات Docker.
- `--pm2` استخدام PM2 لإدارة العمليات (القيمة الافتراضية).
- `--skip-tests` تخطي تنفيذ الاختبارات قبل النشر.

أمثلة:
```bash
./deploy.sh --docker
./deploy.sh --pm2 --skip-tests
```

## استخدام ملف `.env`

يحوي الملف جميع الإعدادات الحساسة مثل المنافذ، مسار قاعدة البيانات، ومفاتيح JWT. يجب تعديل هذه القيم بما يناسب بيئتك وعدم إبقاء بيانات الدخول الافتراضية قيد الاستخدام. يمكن ضبط المتغير `HOST` لتحديد العنوان الذي يستمع عليه الخادم، والقيمة الافتراضية هي `0.0.0.0`.
تأكد من تعيين متغير **`JWT_SECRET`** قبل تشغيل التطبيق؛ فالقيمة الاحتياطية الحالية سيتم إزالتها لاحقًا.

### أهم المتغيرات الافتراضية

| المتغير | القيمة المبدئية | الوصف |
|---------|-----------------|-------|
| `HOST` | `0.0.0.0` | عنوان الاستماع للخادم |
| `PORT` | `3000` | المنفذ الرئيسي للتطبيق |
| `WEBSOCKET_PORT` | `3001` | منفذ خدمة WebSocket |
| `ADMIN_USERNAME` | `admin` | اسم المستخدم الافتراضي للوحة التحكم |
| `ADMIN_PASSWORD` | `admin123` | كلمة المرور الافتراضية |
| `DATABASE_PATH` | `./data/whatsapp_manager.db` | مسار قاعدة البيانات |
| `JWT_SECRET` | `change-me` | مفتاح توقيع JSON Web Token |

## ملاحظات النشر على الخادم

بعد تشغيل `npm run build` سيُنشئ Next.js مجلد `.next` والذي يحتوي على `standalone` و`static`. احرص على رفع المجلدين معًا داخل المسار نفسه عند نقل المشروع. عدم وجود مجلد `static` يسبب أخطاء 404 للملفات تحت `/_next/static`.


## استيراد مكونات واجهة المستخدم

يمكنك إضافة مكونات جديدة من مكتبة **shadcn/ui** عبر تنفيذ:

```bash
npx shadcn@latest add <component-url>
```

يعدل هذا الأمر بعض ملفات المشروع وقد ينشئ ملفات جديدة داخل مجلد `components` أو مجلدات أخرى حسب المكون. بعد التنفيذ تأكد من نجاح أوامر البناء والتدقيق:

```bash
npm run build
npm run lint
```

إذا مرت الأوامر بدون أخطاء قم بإنشاء **commit** للتغييرات.

---

بعد إكمال الإعداد، يمكنك البدء في إدارة رسائل واتساب بكفاءة وأمان.

>>>>>>> 83e0b5f7cbb5c54a0d6a252d420d7c6ecc85a6da
