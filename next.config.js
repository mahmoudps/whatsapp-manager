const path = require('path')
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["whatsapp-web.js", "puppeteer", "fluent-ffmpeg"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // إضافة externals للمكتبات التي تعمل فقط على الخادم
      config.externals.push({
        "whatsapp-web.js": "commonjs whatsapp-web.js",
        puppeteer: "commonjs puppeteer",
        "fluent-ffmpeg": "commonjs fluent-ffmpeg",
        "better-sqlite3": "commonjs better-sqlite3",
      })
    }

    // تجاهل ملفات معينة في العميل
  config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    }

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname),
    }

    return config
  },
  // تمكين ضغط الاستجابات
  compress: true,
  // تحسين الصور
  images: {
    domains: ["localhost"],
    formats: ["image/webp", "image/avif"],
    unoptimized: true,
  },
  // إعدادات الأمان
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
