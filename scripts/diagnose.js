#!/usr/bin/env node
// Basic diagnostics script for WhatsApp Manager

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const pkg = require('../package.json')

function logOk(msg) {
  console.log(`\x1b[32m✓\x1b[0m ${msg}`)
}
function logWarn(msg) {
  console.log(`\x1b[33m⚠\x1b[0m ${msg}`)
}
function logError(msg) {
  console.log(`\x1b[31m✗\x1b[0m ${msg}`)
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}

function checkNode() {
  const required = pkg.engines && pkg.engines.node ? pkg.engines.node.replace('>=', '') : '0'
  const current = process.version.replace('v', '')
  if (compareVersions(current, required) >= 0) {
    logOk(`Node.js ${current}`)
  } else {
    logError(`Node.js ${current} (requires >= ${required})`)
  }
}

function checkNpm() {
  try {
    const output = execSync('npm -v', { encoding: 'utf8' }).trim()
    const required = pkg.engines && pkg.engines.npm ? pkg.engines.npm.replace('>=', '') : '0'
    if (compareVersions(output, required) >= 0) {
      logOk(`npm ${output}`)
    } else {
      logError(`npm ${output} (requires >= ${required})`)
    }
  } catch {
    logError('npm not found')
  }
}

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    logOk('.env file found')
  } else {
    logWarn('.env file not found')
  }
}

function checkDatabase() {
  const dbPath = process.env.DATABASE_PATH || './data/whatsapp_manager.db'
  if (fs.existsSync(dbPath)) {
    logOk(`Database file found at ${dbPath}`)
  } else {
    logWarn(`Database file not found at ${dbPath}`)
  }
}

function run() {
  console.log('=== WhatsApp Manager Diagnostics ===')
  checkNode()
  checkNpm()
  checkEnvFile()
  checkDatabase()
}

run()
