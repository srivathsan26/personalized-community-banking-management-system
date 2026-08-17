const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const net = require("net");

const DEV_URL = "http://127.0.0.1:8080";
const API_PORT = 8001;
const API_HOST = "127.0.0.1";
const BACKEND_START_TIMEOUT_MS = 30000;

let mainWindow = null;
let backendProcess = null;
let appQuitting = false;

function getBackendExecutablePath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "server", "backend-server.exe");
  }

  return null; // Dev mode uses Python directly
}

function ensureDesktopData() {
  const dataDir = path.join(app.getPath("userData"), "backend-data");
  fs.mkdirSync(dataDir, { recursive: true });
  return dataDir;
}

function getPythonCommand() {
  if (app.isPackaged) {
    return null; // Packaged app uses exe, not Python
  }
  return process.env.PYTHON_PATH || "py";
}

function startBackend() {
  if (app.isPackaged) {
    const desktopDataDir = ensureDesktopData();
    const exePath = getBackendExecutablePath();
    backendProcess = spawn(exePath, ["--mode", "dev"], {
      env: {
        ...process.env,
        DESKTOP_DATA_DIR: desktopDataDir,
      },
      stdio: "pipe",
      windowsHide: true,
    });
  } else {
    const backendScript = path.join(app.getAppPath(), "backend", "desktop_server.py");
    const cwd = app.getAppPath();
    backendProcess = spawn(getPythonCommand(), [backendScript, "--mode", "dev"], {
      cwd,
      env: {
        ...process.env,
        DESKTOP_SERVER_ROOT: cwd,
      },
      stdio: "pipe",
      windowsHide: true,
    });
  }

  backendProcess.stdout.on("data", (chunk) => {
    process.stdout.write(`[backend] ${chunk}`);
  });

  backendProcess.stderr.on("data", (chunk) => {
    process.stderr.write(`[backend] ${chunk}`);
  });

  backendProcess.on("exit", (code) => {
    if (!appQuitting && code !== 0) {
      dialog.showErrorBox(
        "Backend stopped",
        `The desktop backend exited unexpectedly with code ${code}.`
      );
    }
  });
}

function stopBackend() {
  if (!backendProcess || backendProcess.killed) {
    return;
  }

  backendProcess.kill();
}

function waitForBackend() {
  const deadline = Date.now() + BACKEND_START_TIMEOUT_MS;

  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = net.createConnection({ host: API_HOST, port: API_PORT });

      socket.once("connect", () => {
        socket.end();
        resolve();
      });

      socket.once("error", () => {
        socket.destroy();
        if (Date.now() >= deadline) {
          reject(new Error("Timed out waiting for the desktop backend to start."));
          return;
        }

        setTimeout(tryConnect, 300);
      });
    };

    tryConnect();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#f5f7fb",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  } else {
    mainWindow.loadURL(DEV_URL);
  }
}

app.whenReady().then(async () => {
  try {
    startBackend();
    await waitForBackend();
    createWindow();
  } catch (error) {
    let errorMsg = error.message;
    if (!app.isPackaged) {
      errorMsg += "\n\nMake sure Python is installed and available on PATH.";
    }
    dialog.showErrorBox("Desktop app failed to start", errorMsg);
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  appQuitting = true;
  stopBackend();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
