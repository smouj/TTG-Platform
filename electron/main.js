// ============================================================
// Trading Tazos Game — Electron Desktop App
// Cross-platform wrapper: Windows, macOS, Linux.
// ============================================================
/* eslint-disable @typescript-eslint/no-require-imports */

const { app, BrowserWindow, Menu, shell, screen } = require("electron")
const path = require("path")

const IS_DEV = process.env.NODE_ENV === "development"
const PROD_URL = "https://medaclawarena.com"
const DEV_URL = "http://localhost:3000"

let mainWindow: any = null
let splashWindow: any = null

// ─── Splash Screen ──────────────────────────────────────────
function createSplash() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const splashW = 480
  const splashH = 480

  splashWindow = new BrowserWindow({
    width: splashW,
    height: splashH,
    x: Math.round((sw - splashW) / 2),
    y: Math.round((sh - splashH) / 2),
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    backgroundColor: "#1a1a1a",
    icon: path.join(__dirname, "splash.png"),
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  })

  // Inline splash HTML with the square logo
  const splashPath = path.join(__dirname, "splash.png")
  splashWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #1a1a1a;
      display: flex; align-items: center; justify-content: center;
      height: 100vh; overflow: hidden;
    }
    img {
      width: 85%; height: auto;
      animation: pulse 2.5s ease-in-out infinite;
    }
    .version {
      position: fixed; bottom: 16px; right: 20px;
      color: #666; font: bold 11px monospace; letter-spacing: 0.15em;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.9; }
      50% { transform: scale(1.04); opacity: 1; }
    }
  </style>
</head>
<body>
  <img src="file://${splashPath.replace(/\\\\/g, "/")}" alt="Trading Tazos Game" />
  <span class="version">v0.3.0</span>
</body>
</html>
    `)}`
  )
}

// ─── Main Window ────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Trading Tazos Game",
    icon: path.join(__dirname, "..", "public", "logo", "logo-icon-black.png"),
    backgroundColor: "#0a0a0a",
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (IS_DEV) mainWindow.loadURL(DEV_URL)
  else mainWindow.loadURL(PROD_URL)

  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    if (url.startsWith("https://medaclawarena.com") || url.startsWith("http://localhost")) {
      return { action: "allow" }
    }
    shell.openExternal(url)
    return { action: "deny" }
  })

  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close()
      splashWindow = null
    }
  })

  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

// ─── App Menu ───────────────────────────────────────────────
const menuTemplate: any[] = [
  {
    label: "Trading Tazos Game",
    submenu: [
      { label: "About", role: "about" },
      { type: "separator" },
      { label: "Quit", accelerator: "CmdOrCtrl+Q", role: "quit" },
    ],
  },
  { label: "Edit", submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }] },
  { label: "View", submenu: [{ role: "reload" }, { role: "forceReload" }, { role: "toggleDevTools" }, { type: "separator" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" }, { role: "togglefullscreen" }] },
]

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))

  createSplash()
  // Brief splash before creating main window
  setTimeout(createWindow, 1200)

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
