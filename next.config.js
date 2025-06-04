/** @type {import('next').NextConfig} */
const nextConfig = {
  // إعدادات أساسية
  reactStrictMode: true,
  poweredByHeader: false,

  // إعدادات الإنتاج
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  serverExternalPackages: ["whatsapp-web.js", "puppeteer", "sqlite3"],

  // إعدادات الصور
  images: {
    domains: ["localhost", "wa-api.developments.world"],
    formats: ["image/webp", "image/avif"],
    unoptimized: false,
  },

  // إعدادات الأمان (مخففة للملفات الثابتة)
  headers: async () => [
    {
      source: "/_next/static/(.*)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/((?!_next/static|favicon.ico).*)",
      headers: [
        {
          key: "X-Frame-Options",
          value: "SAMEORIGIN",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
      ],
    },
  ],

  // إعدادات webpack
  webpack: (config, { dev, isServer }) => {
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

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    return config
  },

  // إعدادات البناء
  output: "standalone",
  compress: true,
  trailingSlash: false,

  // إعدادات TypeScript و ESLint
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
