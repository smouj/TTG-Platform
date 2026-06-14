// ============================================================
// Trading Tazos Game — Electron Desktop App
// Cross-platform launcher: Windows, macOS, Linux.
// ============================================================

const { app, BrowserWindow, Menu, shell, screen, Tray, nativeImage } = require("electron")
const path = require("path")
const fs = require("fs")

const IS_DEV = process.env.NODE_ENV === "development"
const PROD_URL = "https://tradingtazosgame.com"
const DEV_URL = "http://localhost:3000"
const VERSION = "0.7.0"

let mainWindow = null
let splashWindow = null
let tray = null

// ─── Assets ─────────────────────────────────────────────────
function getAsset(name) {
  // Try multiple paths for packaged vs dev
  const candidates = [
    path.join(__dirname, "assets", name),
    path.join(__dirname, name),
    path.join(__dirname, "..", "public", "logo", name),
    path.join(__dirname, "..", "..", "public", "logo", name),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return candidates[0] // fallback
}

// ─── Splash Screen ──────────────────────────────────────────
function createSplash() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const splashW = 460
  const splashH = 460

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
    icon: getAsset("logo-icon-black.png"),
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  })

  const splashSvg = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#1a1a1a;display:flex;align-items:center;justify-content:center;flex-direction:column;height:100vh;overflow:hidden;font-family:system-ui,sans-serif}
.logo{width:220px;height:220px;background:#FFCC00;border:4px solid #1a1a1a;border-radius:24px;display:flex;align-items:center;justify-content:center;box-shadow:6px 6px 0 #FF6B00,12px 12px 0 #E3350D;animation:pulse 2.5s ease-in-out infinite}
.logo span{font-size:64px;font-weight:900;color:#1a1a1a;letter-spacing:-2px}
.title{margin-top:28px;font-size:20px;font-weight:900;color:#FFCC00;letter-spacing:0.1em;text-transform:uppercase;text-shadow:2px 2px 0 #E3350D}
.subtitle{margin-top:6px;font-size:10px;font-weight:700;color:#666;letter-spacing:0.2em;text-transform:uppercase}
.version{position:fixed;bottom:14px;right:18px;color:#555;font:bold 10px monospace;letter-spacing:0.15em}
.dots{margin-top:16px;display:flex;gap:6px}
.dot{width:8px;height:8px;border-radius:50%;background:#FFCC00;animation:bounce 0.8s ease-in-out infinite}
.dot:nth-child(2){animation-delay:0.15s;background:#E3350D}
.dot:nth-child(3){animation-delay:0.3s;background:#FF6B00}
.dot:nth-child(4){animation-delay:0.45s;background:#00A1E9}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}
</style></head>
<body>
<div class="logo"><span>TTG</span></div>
<div class="title">Trading Tazos Game</div>
<div class="subtitle">Official Desktop App</div>
<div class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
<span class="version">v${VERSION}</span>
</body>
</html>`

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashSvg)}`)
}

// ─── Main Window ────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Trading Tazos Game",
    icon: getAsset("logo-icon-black.png"),
    backgroundColor: "#1a1a1a",
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
    },
  })

  if (IS_DEV) mainWindow.loadURL(DEV_URL)
  else mainWindow.loadURL(PROD_URL)

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://tradingtazosgame.com") || url.startsWith("http://localhost")) {
      return { action: "allow" }
    }
    shell.openExternal(url)
    return { action: "deny" }
  })

  // Security: prevent navigation away from app
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(PROD_URL) && !url.startsWith(DEV_URL)) {
      event.preventDefault()
    }
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

// ─── System Tray (Windows/Linux) ────────────────────────────
function createTray() {
  // Create a simple 16x16 tray icon from nativeImage
  const icon = nativeImage.createEmpty()
  try {
    const trayIcon = nativeImage.createFromPath(getAsset("logo-icon-black.png"))
    if (!trayIcon.isEmpty()) {
      tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))
      tray.setToolTip("Trading Tazos Game")
      tray.setContextMenu(Menu.buildFromTemplate([
        { label: "Show Window", click: () => mainWindow && mainWindow.show() },
        { label: "Quit", click: () => { app.isQuitting = true; app.quit() } },
      ]))
      tray.on("double-click", () => mainWindow && mainWindow.show())
    }
  } catch (_) { /* tray icon optional */ }
}

// ─── App Menu ───────────────────────────────────────────────
const menuTemplate = [
  {
    label: "Trading Tazos Game",
    submenu: [
      { label: "About Trading Tazos Game", role: "about" },
      { type: "separator" },
      { label: "Quit", accelerator: "CmdOrCtrl+Q", role: "quit" },
    ],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" }, { role: "redo" }, { type: "separator" },
      { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" },
    ],
  },
  {
    label: "View",
    submenu: [
      { role: "reload" }, { role: "forceReload" }, { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  },
  {
    label: "Help",
    submenu: [
      { label: "Website", click: () => shell.openExternal("https://tradingtazosgame.com") },
      { label: "GitHub", click: () => shell.openExternal("https://github.com/smouj/Trading-Tazos-Game") },
    ],
  },
]

// ─── App Lifecycle ──────────────────────────────────────────
app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))
  createSplash()
  setTimeout(createWindow, 1500)
  if (process.platform !== "darwin") createTray()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else if (mainWindow) mainWindow.show()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}
