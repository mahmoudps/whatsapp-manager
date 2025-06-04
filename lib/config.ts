export const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'your-secret-key' : undefined)

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in production environment')
}

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
