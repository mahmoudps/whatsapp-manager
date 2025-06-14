# WhatsApp Manager

إدارة متكاملة لجلسات واتساب عبر واجهة ويب مبنية على **Next.js** و **Node.js**. يهدف المشروع إلى تبسيط إدارة عدة أجهزة واتساب من خلال لوحة تحكم موحَّدة وواجهات برمجة REST، مع دعم اختياري للبث الفوري عبر WebSocket.

## المزايا
- تحكم في عدة جلسات واتساب من مكان واحد
- واجهة تفاعلية مبنية بـ Next.js و React
- API REST لإدارة الجلسات والأجهزة
- قاعدة بيانات SQLite سهلة الإعداد
- خادم WebSocket للبث الفوري (اختياري)
- سكربت CLI لتبسيط تشغيل الحاويات وإدارة النظام

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

# تشغيل الخادم في وضع التطوير
npm run dev
# تشغيل خادم WebSocket (عند الحاجة)
npm run ws
```

### تثبيت Chrome لـ Puppeteer
عند استعمال `PUPPETEER_SKIP_DOWNLOAD=1` يجب تثبيت متصفح متوافق يدويًا:
```bash
npx puppeteer browsers install chrome
```
أو تحديد المسار عبر المتغير `PUPPETEER_EXECUTABLE_PATH`. في حال تركه فارغًا سيقوم السكربت بتنزيل نسخة متوافقة تلقائيًا عند التشغيل.

## Docker
لإنشاء نسخة مهيأة للإنتاج:
```bash
docker-compose up --build -d
```
يُشغِّل هذا الأمر حاوية التطبيق مع Nginx ويتولى السكربت `start-production.sh` ضبط البيئة وبدء خادم WebSocket افتراضيًا. يمكن إيقاف البث الفوري بوضع `ENABLE_WEBSOCKET=false` في ملف البيئة.

## إعداد متغيرات البيئة
انسخ الملف الافتراضي ثم غيِّر القيم الحساسة قبل التشغيل:
```bash
cp .env.example .env
```
أهم المتغيرات:
- `ADMIN_USERNAME` و`ADMIN_PASSWORD`: بيانات الدخول للوحة التحكم.
- `JWT_SECRET`: مفتاح توقيع التوكنات.
- `DATABASE_PATH`: مسار قاعدة البيانات.
- `ENABLE_WEBSOCKET` و`WEBSOCKET_PORT`: تشغيل خادم WebSocket وتحديد المنفذ.
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
أبرز الأوامر:
```bash
wa-manager start    # تشغيل الحاويات
wa-manager stop     # إيقافها
wa-manager status   # حالة التشغيل
wa-manager install full  # تثبيت النظام مع Nginx وSSL
```

## تشغيل الاختبارات
```bash
cp .env.test .env
PUPPETEER_SKIP_DOWNLOAD=1 npm install --ignore-scripts
npm test
```
قد تتطلب بعض الاختبارات توفر تبعيات إضافية حسب البيئة.

## فحص الكود
لتشغيل ESLint:
```bash
npm run lint
```
ولإصلاح المشاكل تلقائيًا:
```bash
npm run lint:fix
```

## الرخصة
[MIT](LICENSE)
