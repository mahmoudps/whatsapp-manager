# 🚀 تعليمات التشغيل السريع

## للتشغيل الفوري:
\`\`\`bash
./wa-manager.sh start
\`\`\`

## أو يدوياً:
\`\`\`bash
npm install --legacy-peer-deps
npm run setup
npm run dev
\`\`\`
سيقوم الأمر `npm run setup` بإنشاء قاعدة البيانات بالجداول الصحيحة
وفق المخطط الموجود في `lib/database.ts`.

## بيانات الدخول:
- اسم المستخدم: admin
- كلمة المرور: admin123
**هام:** يجب تغيير بيانات الدخول الافتراضية قبل نشر التطبيق.
يمكن تعيين القيم الخاصة بك عبر متغيرات البيئة مثلاً:
\`\`\`bash
export ADMIN_USERNAME=myadmin
export ADMIN_PASSWORD=supersecret
\`\`\`

## الرابط:
http://localhost:3000 أو http://localhost:3001
يستمع الخادم افتراضيًا على `0.0.0.0`. يمكن تغيير العنوان عبر المتغير `HOST` في بيئة التشغيل.

---

# 🚀 Quick Start Instructions

## For immediate start:
\`\`\`bash
wa-manager start
\`\`\`

## Or manually:
\`\`\`bash
npm install --legacy-peer-deps
npm run setup
npm run dev
\`\`\`
Running `npm run setup` will create the database schema as defined in
`lib/database.ts`.

## Login credentials:
- Username: admin
- Password: admin123
**Important:** Replace the default credentials before deploying.
Set your own values via environment variables:
\`\`\`bash
export ADMIN_USERNAME=myadmin
export ADMIN_PASSWORD=supersecret
\`\`\`

## URL:
http://localhost:3000 or http://localhost:3001
The server listens on `0.0.0.0` by default. Set the `HOST` environment variable to change this.

### Development login test

For local debugging you can use the `components/login-test.tsx` component to
verify authentication. It renders nothing when `NODE_ENV` is `production`, so it
should not be included in production builds.
