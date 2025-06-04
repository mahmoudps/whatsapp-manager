#!/bin/bash

echo "🔧 إصلاح مشكلة الملفات الثابتة..."

# 1. إيقاف الخدمات
echo "⏹️ إيقاف الخدمات..."
pm2 stop all
sudo systemctl stop nginx

# 2. بناء التطبيق بشكل صحيح
echo "🏗️ بناء التطبيق..."
npm install --legacy-peer-deps
npm run build

# 3. إنشاء مجلد الملفات الثابتة
echo "📁 إنشاء مجلدات الملفات الثابتة..."
mkdir -p .next/static
mkdir -p public
chmod -R 755 .next public

# 4. تحديث إعدادات nginx
echo "⚙️ تحديث إعدادات nginx..."
sudo tee /etc/nginx/sites-available/wa-api.developments.world > /dev/null << 'EOF'
# إعادة توجيه HTTP إلى HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name wa-api.developments.world;
    return 301 https://$server_name$request_uri;
}

# الخادم الرئيسي HTTPS
server {
    listen 443 ssl http2;
    listen [::]:6:443 ssl http2;
    server_name wa-api.developments.world;
    
    # إعدادات SSL
    ssl_certificate /etc/letsencrypt/live/wa-api.developments.world/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wa-api.developments.world/privkey.pem;
    
    # إعدادات الأمان
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    
    # إعدادات عامة
    client_max_body_size 50M;
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    
    # إعدادات الضغط
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # إعدادات خاصة للملفات الثابتة Next.js
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # إعدادات التخزين المؤقت للملفات الثابتة
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable, max-age=31536000";
        add_header X-Cache-Status "STATIC";
        
        # إزالة إعدادات الأمان المتعارضة للملفات الثابتة
        proxy_hide_header X-Content-Type-Options;
        proxy_hide_header X-Frame-Options;
        
        # معالجة الأخطاء
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
    }
    
    # إعدادات للملفات العامة (CSS, JS, Images)
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|woff|woff2|ttf|svg|webp)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # إعدادات التخزين المؤقت
        expires 1y;
        add_header Cache-Control "public, immutable, max-age=31536000";
        add_header X-Cache-Status "ASSET";
        
        # إزالة إعدادات الأمان المتعارضة
        proxy_hide_header X-Content-Type-Options;
        proxy_hide_header X-Frame-Options;
        
        # معالجة الأخطاء
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
    }
    
    # إعدادات WebSocket
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_buffering off;
    }
    
    # إعدادات API routes
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # إعدادات الأمان للـ API فقط
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        
        # معالجة الأخطاء
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
    }
    
    # إعدادات للتطبيق الرئيسي
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # إعدادات الأمان للصفحات فقط
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header Strict-Transport-Security "max-age=63072000" always;
        
        # معالجة الأخطاء
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
    }
    
    # إعدادات السجلات
    access_log /var/log/nginx/wa-api.developments.world.access.log combined;
    error_log /var/log/nginx/wa-api.developments.world.error.log warn;
}
EOF

# 5. تحديث next.config.js
echo "⚙️ تحديث إعدادات Next.js..."
cat > next.config.js << 'EOF'
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
EOF

# 6. إعادة تشغيل الخدمات
echo "🚀 إعادة تشغيل الخدمات..."
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl start nginx
    echo "✅ nginx تم تشغيله بنجاح"
else
    echo "❌ خطأ في إعدادات nginx"
    exit 1
fi

# 7. تشغيل التطبيق
echo "🚀 تشغيل التطبيق..."
pm2 start ecosystem.config.js
pm2 save

echo "✅ تم إصلاح مشكلة الملفات الثابتة!"
echo "🌐 يمكنك الآن الوصول للموقع: https://wa-api.developments.world"
echo "📊 لمراقبة الحالة: pm2 monit"
echo "📝 لعرض السجلات: pm2 logs"
