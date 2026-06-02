// ============================================================
// Trading Tazos Game — Electron Desktop App
// Cross-platform wrapper: Windows, macOS, Linux.
// ============================================================
/* eslint-disable @typescript-eslint/no-require-imports */

const { app, BrowserWindow, Menu, shell } = require("electron")
const path = require("path")

const IS_DEV = process.env.NODE_ENV === "development"
const PROD_URL = "https://medaclawarena.com"
const DEV_URL = "http://localhost:3000"

let mainWindow: any = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Trading Tazos Game",
    icon: path.join(__dirname, "..", "public", "logo", "logo-icon-black.png"),
    backgroundColor: "#0a0a0a",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Load URL
  const url = IS_DEV ? DEV_URL : PROD_URL
  mainWindow.loadURL(url)

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    if (url.startsWith("https://medaclawarena.com") || url.startsWith("http://localhost")) {
      return { action: "allow" }
    }
    shell.openExternal(url)
    return { action: "deny" }
  })

  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

// App menu
const menuTemplate: any[] = [
  {
    label: "Trading Tazos Game",
    submenu: [
      { label: "About", role: "about" },
      { type: "separator" },
      { label: "Quit", accelerator: "CmdOrCtrl+Q", role: "quit" },
    ],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
    ],
  },
  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "forceReload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "togglefullscreen" },
    ],
  },
]

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
