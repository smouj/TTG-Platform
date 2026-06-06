module.exports = {
  apps: [
    {
      name: "ttg",
      script: ".next/standalone/server.js",
      cwd: "/home/smouj/apps/ttg/Trading-Tazos-Game",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
    },
    {
      name: "ttg-ws",
      script: "src/server/ws-server.js",
      cwd: "/home/smouj/apps/ttg/Trading-Tazos-Game",
      env: {
        NODE_ENV: "production",
        WS_PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "150M",
    },
  ],
};
