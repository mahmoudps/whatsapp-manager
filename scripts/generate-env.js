#!/usr/bin/env node

/**
 * Automatically create .env from .env.example if missing and
 * generate a strong JWT_SECRET when needed.
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
// Register ts-node to allow requiring TypeScript files
require('ts-node/register')
const { logger } = require('../lib/logger.ts')

const envPath = path.join(process.cwd(), '.env')
const examplePath = path.join(process.cwd(), '.env.example')

function generateSecret(len = 64) {
  return crypto.randomBytes(len).toString('hex')
}

function ensureEnv() {
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(examplePath)) {
      logger.info('📄 .env غير موجود. سيتم إنشاؤه من .env.example')
      fs.copyFileSync(examplePath, envPath)
    } else {
      logger.error('❌ لم يتم العثور على .env.example ولا يمكن إنشاء .env')
      process.exit(1)
    }
  }

  let env = fs.readFileSync(envPath, 'utf8')
  const match = env.match(/^JWT_SECRET=(.*)$/m)
  if (!match || match[1] === 'fallback-secret-key-change-in-production') {
    const secret = generateSecret(32)
    if (match) {
      env = env.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`)
    } else {
      env += `\nJWT_SECRET=${secret}\n`
    }
    fs.writeFileSync(envPath, env)
    logger.info('🔑 تم إنشاء JWT_SECRET جديد في .env')
  }
}

ensureEnv()
