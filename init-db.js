#!/usr/bin/env node

require('ts-node/register');

(async () => {
  try {
    const { initializeDatabase } = require('./lib/database.ts');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  }
})();
