const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'your-secret-key' : undefined)

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in production environment')
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

module.exports = { JWT_SECRET, JWT_EXPIRES_IN }
