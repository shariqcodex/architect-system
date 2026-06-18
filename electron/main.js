// Electron main process for THE SYSTEM — Hunter Protocol.
// Boots the bundled Next.js standalone server on a free local port, then opens
// a desktop window pointed at it. Everything (incl. the /api/coach AI route)
// runs exactly as it does on the web — there is no second implementation.

const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

// FIXED port (not random): localStorage is scoped to the exact origin
// (http://127.0.0.1:<port>). A stable port keeps the same origin every launch,
// so the player's name, settings, API key, and progress persist across restarts.
const APP_PORT = 39517;

let serverProcess = null;
let mainWindow = null;

// Where the prepared Next standalone bundle lives (unpacked, real files).
function serverDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "app-server")
    : path.join(__dirname, "..", ".next", "standalone");
}

function startServer(port) {
  const dir = serverDir();
  const serverJs = path.join(dir, "server.js");
  // Re-launch our own Electron binary in pure-Node mode to run server.js.
  serverProcess = spawn(process.execPath, [serverJs], {
    cwd: dir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
    },
    stdio: app.isPackaged ? "ignore" : "inherit",
  });
  serverProcess.on("exit", () => {
    serverProcess = null;
  });
}

function waitForServer(port, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const ping = () => {
      const req = http.get({ host: "127.0.0.1", port, path: "/" }, (res) => {
        res.destroy();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) reject(new Error("Server did not start in time."));
        else setTimeout(ping, 300);
      });
    };
    ping();
  });
}

async function createWindow() {
  const port = APP_PORT;
  startServer(port);
  await waitForServer(port);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: "#07060f",
    title: "THE SYSTEM",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  // Open any external (non-localhost) links in the user's real browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://127.0.0.1:${port}`)) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}/`);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Single-instance lock so we don't spawn multiple servers.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow().catch((err) => {
      console.error("Failed to start THE SYSTEM:", err);
      app.quit();
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("quit", () => {
    if (serverProcess) serverProcess.kill();
  });
}
