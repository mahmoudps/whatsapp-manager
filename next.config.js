/** @type {import('next').NextConfig} */
const nextConfig = {
  // إعدادات أساسية
  reactStrictMode: true,
  poweredByHeader: false,

  // دعم Ubuntu 24.04 LTS
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  serverExternalPackages: ["whatsapp-web.js", "puppeteer", "sqlite3"],

  // إعدادات الصور
  images: {
    domains: ["localhost"],
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    unoptimized: true,
  },

  // إعدادات الأمان
  headers: async () => [
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
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ],
    },
  ],

  // إعدادات webpack محسنة لـ Ubuntu 24
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // تحسينات للإنتاج
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            name: "common",
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      }
    }

    // إعدادات خاصة بـ Ubuntu 24
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
      child_process: false,
    }

    // استبعاد المكتبات الإشكالية
    config.externals = [
      ...(config.externals || []),
      {
        "whatsapp-web.js": "commonjs whatsapp-web.js",
        puppeteer: "commonjs puppeteer",
        sqlite3: "commonjs sqlite3",
        ws: "commonjs ws",
        canvas: "commonjs canvas",
        sharp: "commonjs sharp",
        "fluent-ffmpeg": "commonjs fluent-ffmpeg",
        "utf-8-validate": "commonjs utf-8-validate",
        bufferutil: "commonjs bufferutil",
      },
    ]

    // إضافة alias للتعامل مع fluent-ffmpeg
    config.resolve.alias = {
      ...config.resolve.alias,
      "./lib-cov/fluent-ffmpeg": false,
    }

    // تجاهل تحذيرات معينة
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Can't resolve 'canvas'/,
      /Module not found: Can't resolve 'encoding'/,
      /Module not found: Can't resolve '\.\/lib-cov\/fluent-ffmpeg'/,
    ]

    // إضافة loader للملفات الثنائية
    config.module.rules.push({
      test: /\.(node|so|dylib)$/,
      use: "node-loader",
    })

    return config
  },

  // إعدادات البناء
  output: "standalone",

  // إعدادات TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },

  // إعدادات ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },

  // إعدادات الضغط
  compress: true,

  // إعدادات الـ trailing slash
  trailingSlash: false,

  // إعدادات إعادة التوجيه
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/api",
        destination: "/api/health",
        permanent: false,
      },
    ]
  },

  // إعدادات إعادة الكتابة
  async rewrites() {
    return [
      {
        source: "/api/ws",
        destination: "http://localhost:3001",
      },
    ]
  },
}

module.exports = nextConfig
