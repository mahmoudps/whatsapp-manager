# WhatsApp Manager

**Languages:** [English](README.en.md) | [العربية](README.md)

إدارة متكاملة لجلسات واتساب عبر واجهة ويب مبنية على **Next.js** و **Node.js**. يهدف المشروع إلى تبسيط إدارة عدة أجهزة واتساب من خلال لوحة تحكم موحَّدة وواجهات برمجة REST، مع دعم اختياري للبث الفوري عبر WebSocket.

## المزايا
- تحكم في عدة جلسات واتساب من مكان واحد
- واجهة تفاعلية مبنية بـ Next.js و React
- API REST لإدارة الجلسات والأجهزة
- قاعدة بيانات SQLite سهلة الإعداد
- خادم WebSocket للبث الفوري (اختياري)
- سكربت CLI لتبسيط تشغيل الحاويات وإدارة النظام

### لقطات الشاشة
![واجهة الويب](docs/images/web-ui.svg)
![سطر الأوامر](docs/images/cli-example.svg)

## المتطلبات الأساسية
- Node.js **20** أو أحدث
- Docker وDocker Compose (للعمل داخل الحاويات)
- Git

## التشغيل المحلي
```bash
# استنساخ المستودع
git clone <repository-url>
cd whatsapp-manager

# تثبيت الاعتماديات (مع تخطي تنزيل المتصفح المدمج)
PUPPETEER_SKIP_DOWNLOAD=1 npm install --ignore-scripts
# بعد الانتهاء **يجب** تشغيل الأمر التالي لتجميع `bcrypt` و`better-sqlite3`
npm run rebuild:native

# تشغيل الخادم في وضع التطوير
npm run dev
# تشغيل خادم WebSocket (عند الحاجة)
npm run ws
```

عند الرغبة في تشغيل خادم WebSocket مباشرة على المضيف (خارج Docker)، تأكد أولاً من
بناءه عبر:

```bash
npm run build:ws
node dist/websocket-server.js
```

يمكن تضمين مجلد `dist/` في حزم التوزيع أو جعل عملية البناء تتم تلقائيًا أثناء
التثبيت.

### جلب رمز CSRF
قبل إرسال أي طلبات POST مثل تسجيل الدخول، احصل أولاً على رمز الحماية من
المسار `GET /api/csrf-token`. يُعيد هذا المسار قيمة `csrfToken` بالشكل:

```json
{ "csrfToken": "..." }
```

كما يقوم بضبط ملف تعريف ارتباط باسم `_csrf` تلقائيًا ليتم التحقق منه لاحقًا.
يجب تمرير هذه القيمة في الترويسة `X-CSRF-Token` عند استدعاء واجهات API المحمية.

### تثبيت Chrome لـ Puppeteer
عند استعمال `PUPPETEER_SKIP_DOWNLOAD=1` يجب تثبيت متصفح متوافق يدويًا:
```bash
npx puppeteer browsers install chrome
```
أو تحديد المسار عبر المتغير `PUPPETEER_EXECUTABLE_PATH`. في حال تركه فارغًا سيقوم السكربت بتنزيل نسخة متوافقة تلقائيًا عند التشغيل.
#### استكشاف أخطاء Puppeteer
تتضمن صورة Docker المتصفح Chromium وتضبط افتراضيًا `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` مع `PUPPETEER_ARGS=--disable-crashpad`. عند تشغيل التطبيق خارج Docker وظهور الخطأ `chrome_crashpad_handler: --database is required` يكفي إضافة نفس العلم يدويًا في ملف `.env`.


## Docker
لإنشاء نسخة مهيأة للإنتاج:
تأكد من أن دليلي `data/` و`logs/` قابلان للكتابة بواسطة UID `1001` قبل التشغيل:
```bash
sudo chown -R 1001:1001 data logs
docker-compose up --build -d
```
يُشغِّل هذا الأمر حاوية التطبيق مع Nginx ويتولى السكربت `start-production.sh` ضبط البيئة وبدء خادم WebSocket افتراضيًا. يمكن إيقاف البث الفوري بوضع `ENABLE_WEBSOCKET=false` في ملف البيئة.
يجب التأكد من أن المنفذ المحدد في `WEBSOCKET_PORT` غير مشغول قبل التشغيل وإلا سيتوقف السكربت عن العمل.

يجب التأكد من أن المنفذ المحدد في `WEBSOCKET_PORT` غير مشغول قبل التشغيل وإلا سيتوقف السكربت عن العمل برسالة "Port $WEBSOCKET_PORT already in use".

## إعداد متغيرات البيئة
انسخ الملف الافتراضي ثم غيِّر القيم الحساسة قبل التشغيل:
```bash
cp .env.example .env
```
أهم المتغيرات:
- `ADMIN_USERNAME` و`ADMIN_PASSWORD`: بيانات الدخول للوحة التحكم.
- `JWT_SECRET`: مفتاح توقيع التوكنات.
- `DATABASE_PATH`: مسار قاعدة البيانات.
- `WHATSAPP_WEB_VERSION_URL`: مسار HTML لإصدار WhatsApp Web.
- `CORS_ORIGIN`: قائمة بالمصادر المسموح بها مفصولة بفواصل **دون مسافات**.
- `ENABLE_WEBSOCKET` و`WEBSOCKET_PORT`: تشغيل خادم WebSocket وتحديد المنفذ. يجب أن يكون هذا المنفذ متاحًا وغير مستخدم قبل التشغيل.
- بقية المتغيرات موثقة داخل `.env.example` ويمكن تعديلها حسب الحاجة.

بعد ضبط الملف يمكن تشغيل:
```bash
npm run setup
```
لتهيئة قاعدة البيانات وإنشاء القيم المبدئية.

## سكربت CLI
يوفر السكربت `wa-manager.sh` أوامر سريعة لإدارة الخدمة. بعد نسخه إلى المسار المناسب:
```bash
sudo cp wa-manager.sh /usr/local/bin/wa-manager
sudo chmod +x /usr/local/bin/wa-manager
```
قبل تشغيل الأوامر تأكد من أن دليلي `data/` و`logs/` قابلان للكتابة بواسطة UID `1001`:
```bash
sudo chown -R 1001:1001 data logs
```
أبرز الأوامر:
```bash
wa-manager start    # تشغيل الحاويات
wa-manager stop     # إيقافها
wa-manager restart  # إعادة تشغيل النظام
wa-manager status   # حالة التشغيل
wa-manager install full  # تثبيت النظام مع Nginx وSSL
wa-manager install pm2   # تثبيت Node.js وPM2 وتشغيل التطبيق مباشرة على المضيف
```

أثناء تشغيل `wa-manager install full` سيُطلب منك تحديد اسم المستخدم وكلمة المرور للمشرف، مع قيم افتراضية يمكن قبولها بالضغط على Enter.
بعد تثبيت الأمر عبر `install cli` أو `install full` يتم إنشاء ملف إكمال تلقائي في `/etc/bash_completion.d/wa-manager`. يمكن تفعيله مباشرةً بدون إعادة تسجيل الخروج عبر الأمر:
```bash
source /etc/bash_completion.d/wa-manager
```
> **ملاحظة:** يقوم سكربت التثبيت الآن بضبط `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` و`PUPPETEER_ARGS=--disable-crashpad` داخل ملف `.env` لاستخدام Chromium المثبت مسبقًا بشكل افتراضي.

### تشغيل التطبيق عبر PM2
بعد تنفيذ أمر التثبيت يمكن إدارة الخدمة باستخدام PM2:
تأكد كذلك من أن مجلدي `data/` و`logs/` قابلان للكتابة بواسطة UID `1001`:
```bash
sudo chown -R 1001:1001 data logs
```
```bash
pm2 status
pm2 logs
```

يُستعمل الأمر `wa-manager restart` لإعادة تشغيل جميع الحاويات وخادم WebSocket عند الحاجة.

### التحقق من خادم WebSocket
بعد التشغيل يمكن التأكد من أن الخادم يعمل عبر تنفيذ:
```bash
curl http://localhost:3000/api/socket/status
# أو
curl http://localhost:3001/health
```
ستحصل على استجابة JSON تحتوي على المعرف `whatsapp-manager-ws` مما يدل على أن الخادم قيد التشغيل.
> **ملاحظة:** عند استخدام Nginx أو أي reverse proxy، يجب تمرير المسار `/health` إلى خادم WebSocket لضمان عمل فحوصات الصحة.

```nginx
location /health {
    proxy_pass http://localhost:3001/health;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### التحقق من الوصول عبر Nginx
بعد تشغيل الحاويات بواسطة `docker compose up -d` يمكن التأكد من أنها تعمل عبر:
```bash
docker compose ps
```
يجب أن تظهر خدمتا `nginx` و`whatsapp-manager` بحالة `Up`.
ولتأكد من أن المسار الصحي يعمل من خلال Nginx نفّذ:
```bash
curl http://localhost/health
```
ستحصل على استجابة تتضمن `whatsapp-manager-ws` ما يعني أن الخدمة متاحة عبر Nginx.

## تخصيص الألوان
قيم الألوان الأساسية للوضعين الفاتح والداكن محفوظة في الملف `lib/theme.ts`.
يمكن تعديل هذه القيم ثم تشغيل `npm run dev` أو بناء المشروع ليتم تحديث
المتغيرات داخل `styles/themes/colors.css` تلقائيًا عبر ملحق Tailwind.

## التحديث والصيانة
عند جلب التحديثات من المستودع (git pull) شغّل:
```bash
wa-manager rebuild
# أو
npm run setup
```
وذلك لتحديث ملف `.env` والتأكد من وجود المتغيرات الأساسية مثل `JWT_SECRET`.

## تشغيل الاختبارات
```bash
cp .env.test .env
PUPPETEER_SKIP_DOWNLOAD=1 npm install --ignore-scripts
npm run rebuild:native
npm test
```
قد تتطلب بعض الاختبارات توفر تبعيات إضافية حسب البيئة. ويجب إعادة بناء حزم
`bcrypt` و`better-sqlite3` المستعملة في الاختبارات قبل تشغيلها.

## فحص الكود
لتشغيل ESLint:
```bash
npm run lint
```
ولإصلاح المشاكل تلقائيًا:
```bash
npm run lint:fix
```

## استكشاف الأخطاء وإصلاحها
في حال فشل توليد شهادة SSL أثناء التثبيت:
- تأكد من أن الدومين يشير إلى عنوان الخادم الصحيح.
- تحقق من فتح المنافذ **80** و **443** في جدار الحماية.
- يجب تشغيل سكربت التثبيت بصلاحيات الجذر.
- راجع سجلات Certbot في `/var/log/letsencrypt` للحصول على تفاصيل إضافية.
- يمكن تجربة الأمر `certbot renew --dry-run` لاختبار الإعدادات.

## الرخصة
[MIT](LICENSE)
