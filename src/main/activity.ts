import { BrowserWindow } from 'electron';

export function setupActivityTracker(mainWindow: BrowserWindow) {
  // Listen to window focus/blur and notify renderer
  mainWindow.on('focus', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-focus-change', true);
    }
  });

  mainWindow.on('blur', () => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-focus-change', false);
    }
  });
}
