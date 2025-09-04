// ecosystem.config.js
const path = require('path')
const LOG_DIR = path.join(process.env.HOME || __dirname, 'logs', 'twitter_clone')

module.exports = {
  apps: [
    {
      name: 'twitter_clone',
      cwd: __dirname,
      script: 'dist/index.js',
      args: '--production',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '512M',
      time: true,
      watch: false,

      // Log vào HOME thay vì /var/log
      error_file: path.join(LOG_DIR, 'error.log'),
      out_file: path.join(LOG_DIR, 'out.log'),
      merge_logs: true,

      // ENV (có thể gộp luôn NODE_ENV=production)
      env: { NODE_ENV: 'production' },
      env_production: { NODE_ENV: 'production' }
    }
  ]
}
