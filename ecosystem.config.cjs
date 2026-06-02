// PM2 Ecosystem — Trading Tazos Game
// medaclawarena.com — VPS deployment

module.exports = {
  apps: [
    {
      name: "ttg",
      script: "server.js",
      cwd: "/home/smouj/apps/ttg/Trading-Tazos-Game",
      args: "--port 3000",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/home/smouj/.pm2/logs/ttg-error.log",
      out_file: "/home/smouj/.pm2/logs/ttg-out.log",
      merge_logs: true,
      // Restart if >10 consecutive 5-second memory spikes
      max_restarts: 5,
      min_uptime: "10s",
    },
    // MedaClaw Arena — ARCHIVED (stopped)
    {
      name: "medaclaw-arena-archived",
      script: "echo",
      args: '"MedaClaw Arena archived — domain now serves TTG"',
      autorestart: false,
    },
  ],
}
