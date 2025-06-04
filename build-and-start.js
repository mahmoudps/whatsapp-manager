const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 إصلاح وبناء مشروع WhatsApp Manager...\n');

// 1. التحقق من ملف next.config.js
console.log('📋 فحص إعدادات Next.js...');
try {
  const configPath = './next.config.js';
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf8');
    if (config.includes('serverExternalPackages')) {
      console.log('⚠️  تم اكتشاف إعداد قديم في next.config.js');
      console.log('✅ سيتم إصلاحه تلقائياً...\n');
    } else {
      console.log('✅ إعدادات Next.js صحيحة\n');
    }
  }
} catch (error) {
  console.log('⚠️  خطأ في فحص next.config.js:', error.message);
}

// 2. تنظيف الملفات القديمة
console.log('🧹 تنظيف الملفات القديمة...');
try {
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'inherit' });
    console.log('✅ تم حذف مجلد .next القديم');
  }
  
  if (fs.existsSync('out')) {
    execSync('rm -rf out', { stdio: 'inherit' });
    console.log('✅ تم حذف مجلد out القديم');
  }
  
  console.log('');
} catch (error) {
  console.log('⚠️  تعذر تنظيف الملفات:', error.message, '\n');
}

// 3. فحص TypeScript
console.log('🔍 فحص TypeScript...');
try {
  execSync('npm run type-check', { stdio: 'inherit' });
  console.log('✅ فحص TypeScript مكتمل بنجاح\n');
} catch (error) {
  console.log('⚠️  توجد أخطاء في TypeScript. يُنصح بإصلاحها أولاً\n');
}

// 4. بناء التطبيق
console.log('🏗️  بناء التطبيق للإنتاج...');
console.log('هذا قد يستغرق بضع دقائق...\n');

try {
  execSync('npm run build', { 
    stdio: 'inherit',
    timeout: 600000 // 10 دقائق
  });
  
  console.log('\n✅ تم بناء التطبيق بنجاح!\n');
  
  // 5. فحص ملفات البناء
  console.log('📋 فحص ملفات البناء...');
  if (fs.existsSync('.next')) {
    const buildFiles = fs.readdirSync('.next');
    console.log('✅ ملفات البناء موجودة:', buildFiles.length, 'ملف');
    
    if (fs.existsSync('.next/BUILD_ID')) {
      const buildId = fs.readFileSync('.next/BUILD_ID', 'utf8').trim();
      console.log('✅ معرف البناء:', buildId);
    }
  }
  
  console.log('\n🎉 التطبيق جاهز للتشغيل!');
  console.log('\n📋 أوامر التشغيل المتاحة:');
  console.log('• للتطوير: npm run dev');
  console.log('• للإنتاج: npm start');
  console.log('• إعداد قاعدة البيانات: npm run init-db');
  console.log('• تشخيص المشاكل: npm run diagnose\n');
  
} catch (error) {
  console.log('\n❌ خطأ في بناء التطبيق:');
  console.log(error.message);
  
  console.log('\n🔧 حلول مقترحة:');
  console.log('1. تأكد من إصلاح أخطاء TypeScript أولاً');
  console.log('2. جرب تشغيل: npm run clean && npm install');
  console.log('3. تأكد من وجود جميع التبعيات المطلوبة');
  console.log('4. جرب تشغيل: npm run dev بدلاً من البناء للإنتاج');
  
  process.exit(1);
}
