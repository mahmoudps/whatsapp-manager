module.exports = {
  apps: [
    {
      name: "whatsapp-manager-app",
      script: "npm",
      args: "start",
      cwd: process.cwd(),
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        PUPPETEER_EXECUTABLE_PATH: "/usr/bin/chromium-browser",
        PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: "true",
        PUPPETEER_ARGS: "--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-accelerated-2d-canvas,--no-first-run,--no-zygote,--disable-gpu",
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
        ADMIN_USERNAME: process.env.ADMIN_USERNAME,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
        MAX_AUTH_ATTEMPTS: process.env.MAX_AUTH_ATTEMPTS,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        PUPPETEER_EXECUTABLE_PATH: "/usr/bin/chromium-browser",
        PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: "true",
        PUPPETEER_ARGS: "--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage,--disable-accelerated-2d-canvas,--no-first-run,--no-zygote,--disable-gpu",
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
        ADMIN_USERNAME: process.env.ADMIN_USERNAME,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
        MAX_AUTH_ATTEMPTS: process.env.MAX_AUTH_ATTEMPTS,
      },
      error_file: "logs/app-error.log",
      out_file: "logs/app-out.log",
      log_file: "logs/app-combined.log",
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,
      listen_timeout: 3000,
      wait_ready: true,
      // Health check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      // Log rotation
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Performance monitoring
      pmx: true,
      monitoring: false,
      // Advanced PM2 features
      vizion: false,
      automation: false,
      // Node.js specific options
      node_args: [
        "--max-old-space-size=1024",
        "--optimize-for-size"
      ],
    },
    {
      name: "whatsapp-manager-websocket",
      script: "websocket-server.js",
      cwd: process.cwd(),
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        WEBSOCKET_PORT: 3001,
        FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
        JWT_SECRET: process.env.JWT_SECRET,
      },
      env_production: {
        NODE_ENV: "production",
        WEBSOCKET_PORT: 3001,
        FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
        JWT_SECRET: process.env.JWT_SECRET,
      },
      error_file: "logs/websocket-error.log",
      out_file: "logs/websocket-out.log",
      log_file: "logs/websocket-combined.log",
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
      kill_timeout: 5000,
      listen_timeout: 3000,
      wait_ready: true,
      // Health check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      // Log rotation
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Performance monitoring
      pmx: true,
      monitoring: false,
      // Advanced PM2 features
      vizion: false,
      automation: false,
      // Node.js specific options
      node_args: [
        "--max-old-space-size=512",
        "--optimize-for-size"
      ],
    },
  ],

  deploy: {
    production: {
      user: "ubuntu",
      host: ["localhost"],
      ref: "origin/main",
      repo: "https://github.com/your-username/whatsapp-manager.git",
      path: "/opt/whatsapp-manager",
      "pre-deploy-local": "echo 'Starting deployment...'",
      "post-deploy": [
        "npm install --production",
        "npm run build",
        "npm run setup",
        "pm2 reload ecosystem.config.js --env production",
        "pm2 save"
      ].join(" && "),
      "pre-setup": [
        "mkdir -p /opt/whatsapp-manager",
        "mkdir -p logs",
        "mkdir -p data/whatsapp_sessions"
      ].join(" && "),
      "post-setup": "pm2 install pm2-logrotate",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        WEBSOCKET_PORT: 3001,
      },
    },
    staging: {
      user: "ubuntu",
      host: ["staging-server"],
      ref: "origin/develop",
      repo: "https://github.com/your-username/whatsapp-manager.git",
      path: "/opt/whatsapp-manager-staging",
      "post-deploy": [
        "npm install",
        "npm run build",
        "npm run setup",
        "pm2 reload ecosystem.config.js --env staging"
      ].join(" && "),
      env: {
        NODE_ENV: "staging",
        PORT: 3000,
        WEBSOCKET_PORT: 3001,
      },
    },
  },
}

