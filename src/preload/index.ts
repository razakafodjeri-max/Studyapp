import { contextBridge, ipcRenderer } from 'electron';
import { Task, Session, FocusLog } from '../main/db';

contextBridge.exposeInMainWorld('electronAPI', {
  // Database API
  db: {
    getTasks: () => ipcRenderer.invoke('db:getTasks'),
    saveTask: (task: Task) => ipcRenderer.invoke('db:saveTask', task),
    deleteTask: (id: string) => ipcRenderer.invoke('db:deleteTask', id),
    getSessions: () => ipcRenderer.invoke('db:getSessions'),
    saveSession: (session: Session) => ipcRenderer.invoke('db:saveSession', session),
    deleteSession: (id: number) => ipcRenderer.invoke('db:deleteSession', id),
    getFocusLogs: (sessionId: string) => ipcRenderer.invoke('db:getFocusLogs', sessionId),
    saveFocusLog: (log: FocusLog) => ipcRenderer.invoke('db:saveFocusLog', log),
    getSettings: () => ipcRenderer.invoke('db:getSettings'),
    saveSetting: (key: string, value: string) => ipcRenderer.invoke('db:saveSetting', key, value),
    exportData: () => ipcRenderer.invoke('db:exportData')
  },
  
  // Activity / Telemetry API
  activity: {
    getSystemIdleTime: () => ipcRenderer.invoke('get-system-idle-time'),
    onWindowFocusChange: (callback: (focused: boolean) => void) => {
      const listener = (_event: any, focused: boolean) => callback(focused);
      ipcRenderer.on('window-focus-change', listener);
      return () => {
        ipcRenderer.removeListener('window-focus-change', listener);
      };
    }
  },

  // Native Notifications API
  notifications: {
    show: (title: string, body: string) => ipcRenderer.invoke('show-notification', title, body)
  },

  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close')
  }
});
