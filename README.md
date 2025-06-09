# WhatsApp Manager

إدارة جلسات واتساب عبر واجهة ويب تعتمد على **Node.js** و **Next.js**.
يُوفِّر المشروع لوحة تحكم، API REST، ودعم WebSocket للبث الفوري. يمكن تشغيله محليًا
أو داخل حاويات Docker.

## المزايا الرئيسية
- إدارة عدة أجهزة واتساب من واجهة موحدة
- واجهة مبنية بـ Next.js و React
- قاعدة بيانات SQLite بسيطة مدمجة
- خادم WebSocket اختياري للتنبيهات الفورية
- سكربت CLI (`wa-manager.sh`) للتحكم السريع وتشغيل الحاويات

## المتطلبات
- Node.js **18** أو أحدث
- Docker و Docker Compose (للتشغيل داخل الحاويات)
- Git

## طريقة التثبيت السريع
```bash
# استنساخ المستودع
git clone <repository-url>
cd whatsapp-manager

# تثبيت الاعتماديات
npm install

# تشغيل الخادم في وضع التطوير
npm run dev
```

**Note:** Install dependencies with `npm install --legacy-peer-deps` to avoid
peer-dependency conflicts with Jest packages. The included `.npmrc` already
sets this option, but make sure to copy the file when building Docker images so
the flag is honored there. The `wa-manager install full` command now copies
dotfiles (including `.npmrc`) to `/opt/whatsapp-manager` automatically.

### Production

For a production build you can use Docker:

```bash
docker-compose up --build -d
```
يُنشئ ملف `docker-compose.yml` حاوية للتطبيق وأخرى لـ Nginx. يتم تشغيل
السكربت `start-production.sh` داخل الحاوية لتهيئة البيئة وتشغيل WebSocket عند
تفعيل `ENABLE_WEBSOCKET=true`.

## إعداد ملف البيئة
انسخ الملف المثال وعدّل القيم بما يناسبك:
```bash
cp .env.example .env
```
أهم المتغيرات:
- `ADMIN_USERNAME` و`ADMIN_PASSWORD` بيانات الدخول للوحة التحكم
- `JWT_SECRET` مفتاح التوقيع للرموز
- `DATABASE_PATH` مسار قاعدة البيانات (الافتراضي `./data/whatsapp_manager.db`)
- `ENABLE_WEBSOCKET` لتشغيل خادم WebSocket
- `NEXT_PUBLIC_WEBSOCKET_URL` عنوان الاتصال من الواجهة

راجع بقية المتغيرات داخل `.env.example` حسب احتياجك.

## استخدام سكربت CLI
يحتوي المستودع على سكربت `wa-manager.sh` الذي يسهل إدارة الخدمة.
للجعل متاحًا على مستوى النظام:
```bash
sudo cp wa-manager.sh /usr/local/bin/wa-manager
sudo chmod +x /usr/local/bin/wa-manager
```
بعدها يمكن تشغيل الأوامر:
```bash
wa-manager start    # تشغيل الحاويات
wa-manager stop     # إيقافها
wa-manager status   # حالة التشغيل
```
استخدم `wa-manager install full` لإعداد Nginx وشهادة SSL تلقائيًا.

## فحص الشيفرة
لتنفيذ ESLint على جميع ملفات **ts** و **tsx** في المشروع:
```bash
npm run lint
```

## تشغيل الاختبارات
تتطلب الاختبارات وجود جميع الاعتماديات وملف `.env.test`:
```bash
cp .env.example .env.test
PUPPETEER_SKIP_DOWNLOAD=1 npm install --ignore-scripts
npm test
```
قد تفشل الاختبارات في البيئات غير المهيأة بالكامل لعدم توفر بعض التبعيات.

## رخصة الاستخدام
[MIT](LICENSE)
