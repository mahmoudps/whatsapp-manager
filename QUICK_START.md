# 🚀 تعليمات التشغيل السريع

## للتشغيل الفوري:
```bash
./start.sh
```

## أو يدوياً:
```bash
npm install --legacy-peer-deps
npm run setup
npm run dev
```
سيقوم الأمر `npm run setup` بإنشاء قاعدة البيانات بالجداول الصحيحة
وفق المخطط الموجود في `lib/database.ts`.

## بيانات الدخول:
- اسم المستخدم: admin
- كلمة المرور: admin123

## الرابط:
http://localhost:3000 أو http://localhost:3001
يستمع الخادم افتراضيًا على `0.0.0.0`. يمكن تغيير العنوان عبر المتغير `HOST` في بيئة التشغيل.

---

# 🚀 Quick Start Instructions

## For immediate start:
```bash
./start.sh
```

## Or manually:
```bash
npm install --legacy-peer-deps
npm run setup
npm run dev
```
Running `npm run setup` will create the database schema as defined in
`lib/database.ts`.

## Login credentials:
- Username: admin
- Password: admin123

## URL:
http://localhost:3000 or http://localhost:3001
The server listens on `0.0.0.0` by default. Set the `HOST` environment variable to change this.

