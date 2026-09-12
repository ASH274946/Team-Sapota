module.exports = {
  apps: [{
    name: 'vidyaai-backend',
    script: 'dist/app.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '512M',
    restart_delay: 3000,
    max_restarts: 10,
    exp_backoff_restart_delay: 1000,
    kill_timeout: 15000,
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }],
};