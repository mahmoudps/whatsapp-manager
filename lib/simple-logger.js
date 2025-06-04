/**
 * مكتبة تسجيل بسيطة تستخدم console.log بدلاً من winston
 */
const fs = require('fs');
const path = require('path');

// إنشاء مجلد السجلات إذا لم يكن موجودًا
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// تحديد مستوى التسجيل
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// دالة لكتابة السجلات في ملف
function writeToFile(level, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${level}: ${message}\n`;
  
  // كتابة جميع السجلات في ملف combined.log
  fs.appendFileSync(path.join(logDir, 'combined.log'), logMessage);
  
  // كتابة الأخطاء في ملف error.log
  if (level === 'error') {
    fs.appendFileSync(path.join(logDir, 'error.log'), logMessage);
  }
}

// إنشاء كائن logger
const logger = {
  error: function(message) {
    if (LOG_LEVELS[LOG_LEVEL] >= LOG_LEVELS.error) {
      console.error(`ERROR: ${message}`);
      writeToFile('error', message);
    }
  },
  warn: function(message) {
    if (LOG_LEVELS[LOG_LEVEL] >= LOG_LEVELS.warn) {
      console.warn(`WARN: ${message}`);
      writeToFile('warn', message);
    }
  },
  info: function(message) {
    if (LOG_LEVELS[LOG_LEVEL] >= LOG_LEVELS.info) {
      console.info(`INFO: ${message}`);
      writeToFile('info', message);
    }
  },
  debug: function(message) {
    if (LOG_LEVELS[LOG_LEVEL] >= LOG_LEVELS.debug) {
      console.debug(`DEBUG: ${message}`);
      writeToFile('debug', message);
    }
  }
};

module.exports = { logger };
