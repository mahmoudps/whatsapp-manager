import jwt from "jsonwebtoken"
import { JWT_SECRET, JWT_EXPIRES_IN } from "./config"
export { verifyAuth } from "./auth"

export function createAuthToken(payload: { id: number; username: string; role?: string }) {
  return jwt.sign(
    {
      userId: payload.id,
      username: payload.username,
      role: payload.role || "user",
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  )
}

