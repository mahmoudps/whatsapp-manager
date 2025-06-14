import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Dynamically construct a WebSocket URL based on the current environment.
// Falls back to localhost if executed outside the browser.
export function getDefaultWebSocketUrl(): string {
  if (typeof window !== "undefined" && window.location) {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws"
    return `${protocol}://${window.location.host}/ws/socket.io`
  }

  const port = process.env.WEBSOCKET_PORT || "3001"
  const protocol = process.env.NODE_ENV === "production" ? "wss" : "ws"
  return `${protocol}://localhost:${port}/ws/socket.io`
}
