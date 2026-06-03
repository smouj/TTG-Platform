// PM2 Ecosystem — Trading Tazos Game
// Copy to ecosystem.config.cjs and customize paths

module.exports = {
  apps: [
    {
      name: "ttg",
      script: "server.js",
      cwd: "/path/to/your/Trading-Tazos-Game/.next/standalone/Trading-Tazos-Game",
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
      max_restarts: 5,
      min_uptime: "10s",
    },
    {
      name: "ttg-ws",
      script: "src/server/ws-server.js",
      cwd: "/path/to/your/Trading-Tazos-Game",
      env: {
        WS_PORT: "3001",
        WS_HOST: "0.0.0.0",
        JWT_SECRET: "",  // Set in .env or pass via environment
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "150M",
    },
  ],
}
