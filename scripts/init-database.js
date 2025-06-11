#!/usr/bin/env node

// Register ts-node to transpile TypeScript files on the fly using CommonJS
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', moduleResolution: 'node' }
});
const { logger } = require('../lib/logger.ts');

// Load environment variables from .env so configuration is available
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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
