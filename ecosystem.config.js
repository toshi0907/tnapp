module.exports = {
  apps: [{
    name: 'tnapp-api',
    script: 'src/server.js',
    instances: 'max', // CPUコア数と同じ数のインスタンス
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      BASIC_AUTH_ENABLED: 'true',
      AUTH_USER: 'admin',
      AUTH_PASSWORD: 'your-secure-production-password'
    },
    // ログ設定
    log_file: './logs/app.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // 自動再起動設定
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
};