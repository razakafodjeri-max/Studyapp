import { app, BrowserWindow, ipcMain, Notification, powerMonitor } from 'electron';
import * as path from 'path';
import db from './db';
import { setupActivityTracker } from './activity';

// Enable Chromium native Shape Detection / FaceDetector API
app.commandLine.appendSwitch('enable-experimental-web-platform-features');

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    frame: false, // Frameless window for premium Notion/Linear style titlebar
    backgroundColor: '#080c14',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false, // Prevent countdown timers and telemetry loops from freezing in background
    },
  });

  // Setup activity and telemetry listeners
  setupActivityTracker(mainWindow);

  // Load app either from dev server or compiled production build
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
    // Open DevTools in dev mode for debugging if explicitly needed
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure single instance lock
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.studyflow.app'); // Required for Windows notifications to display in background
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Register all IPC bindings
function registerIpcHandlers() {
  // Tasks
  ipcMain.handle('db:getTasks', () => db.getTasks());
  ipcMain.handle('db:saveTask', (event, task) => db.saveTask(task));
  ipcMain.handle('db:deleteTask', (event, id) => db.deleteTask(id));

  // Sessions
  ipcMain.handle('db:getSessions', () => db.getSessions());
  ipcMain.handle('db:saveSession', (event, session) => db.saveSession(session));
  ipcMain.handle('db:deleteSession', (event, id) => db.deleteSession(id));

  // Focus Logs
  ipcMain.handle('db:getFocusLogs', (event, sessionId) => db.getFocusLogs(sessionId));
  ipcMain.handle('db:saveFocusLog', (event, log) => db.saveFocusLog(log));

  // Settings
  ipcMain.handle('db:getSettings', () => db.getSettings());
  ipcMain.handle('db:saveSetting', (event, key, value) => db.saveSetting(key, value));
  ipcMain.handle('db:exportData', () => db.exportData());

  // Native Notifications
  ipcMain.handle('show-notification', (event, title, body) => {
    try {
      if (Notification.isSupported()) {
        const notif = new Notification({
          title,
          body,
          silent: false
        });
        notif.show();
        return true;
      }
    } catch (e) {
      console.error('Failed to trigger native notification:', e);
    }
    return false;
  });

  // System Telemetry
  ipcMain.handle('get-system-idle-time', () => {
    try {
      return powerMonitor.getSystemIdleTime();
    } catch (e) {
      console.error('Failed to get system idle time:', e);
      return 0;
    }
  });

  // Frameless Window controls
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
  });
}
