#!/usr/bin/env node

/**
 * Automatically create .env from .env.example if missing and
 * generate a strong JWT_SECRET when needed.
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function log(type, message) {
  const timestamp = new Date().toISOString()
  console[type](`[${timestamp}] ${message}`)
}

const envPath = path.join(process.cwd(), '.env')
const examplePath = path.join(process.cwd(), '.env.example')

function generateSecret(len = 64) {
  return crypto.randomBytes(len).toString('hex')
}

function ensureEnv() {
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(examplePath)) {
      log('log', '📄 .env غير موجود. سيتم إنشاؤه من .env.example')
      fs.copyFileSync(examplePath, envPath)
    } else {
      log('warn', '.env.example not found. Creating minimal .env')
      fs.writeFileSync(envPath, '')
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
    log('log', '🔑 تم إنشاء JWT_SECRET جديد في .env')
  }
}

ensureEnv()
