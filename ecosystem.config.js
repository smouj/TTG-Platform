module.exports = {
  apps: [
    {
      name: "ttg",
      script: ".next/standalone/server.js",
      cwd: "/home/smouj/apps/ttg/Trading-Tazos-Game",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      max_restarts: 10,
      restart_delay: 5000,
      kill_timeout: 10000,
    },
    {
      name: "ttg-ws",
      script: "src/server/ws-server.js",
      cwd: "/home/smouj/apps/ttg/Trading-Tazos-Game",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        WS_PORT: 3001,
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
