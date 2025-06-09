# دليل المساهمة

شكرًا لاهتمامك بالمساهمة في **WhatsApp Manager**. نرحب بجميع المقترحات
والتصحيحات عبر Pull Requests.

## المتطلبات الأساسية
- Node.js 18 أو أحدث
- Git
- معرفة بأساسيات TypeScript و React/Next.js

## إعداد بيئة التطوير
```bash
git clone https://github.com/mahmoudps/whatsapp-manager.git
cd whatsapp-manager
npm install
cp .env.example .env
npm run dev
```

## خطوات المساهمة
1. أنشئ فرعًا جديدًا من `main` باسم يوضح التغيير
   ```bash
   git checkout -b feature/اسم-الميزة
   ```
2. أضف التغييرات والاختبارات اللازمة
3. تأكد من نجاح أوامر lint والاختبارات
   ```bash
   npm run lint
   npm test
   ```
4. أنشئ Commit واضحًا ثم Push إلى مستودعك
5. افتح Pull Request موضحًا فيه الهدف من التغييرات

## معايير الكود
- استخدام TypeScript للملفات الجديدة
- الالتزام بتنسيق ESLint المرفق
- كتابة تعليقات واضحة عند الحاجة

## الإبلاغ عن الأخطاء واقتراح الميزات
يرجى فتح Issue جديدة مع شرح وافٍ وخطوات إعادة المشكلة أو وصف الميزة المقترحة.

## الترخيص
عند المساهمة في المشروع فإنك توافق على نشر مساهمتك تحت رخصة MIT.
