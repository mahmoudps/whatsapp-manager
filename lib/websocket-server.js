// ملف WebSocket server بسيط للتوافق
// WebSocket يعمل كخدمة منفصلة في PM2

function initializeWebSocket() {
  console.log("ℹ️  WebSocket runs as separate service in PM2")
  return { server: null, io: null }
}

function getWebSocketServer() {
  return { server: null, io: null }
}

module.exports = {
  initializeWebSocket,
  getWebSocketServer,
}
