#!/usr/bin/env node

// Register ts-node to allow requiring TypeScript files
require('ts-node/register');
const { logger } = require('../lib/logger.ts');

(async () => {
  try {
    const { initializeDatabase } = require('../lib/database.ts');
    await initializeDatabase();
    logger.info('✅ Database initialized successfully');
  } catch (err) {
    logger.error('❌ Failed to initialize database:', err);
    process.exit(1);
  }
})();
