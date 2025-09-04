module.exports = {
  apps: [
    {
      name: 'twitter_clone',
      cwd: __dirname,
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '512M',
      time: true,

      watch: false,

      error_file: '/var/log/twitter_clone/error.log',
      out_file: '/var/log/twitter_clone/out.log',
      merge_logs: true,

      // Env cho 2 môi trường (nếu cần override)
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
}
