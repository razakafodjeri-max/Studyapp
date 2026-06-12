import { Task, Session, FocusLog } from '../main/db';

export interface IElectronAPI {
  db: {
    getTasks: () => Promise<Task[]>;
    saveTask: (task: Task) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    getSessions: () => Promise<Session[]>;
    saveSession: (session: Session) => Promise<number>;
    deleteSession: (id: number) => Promise<void>;
    getFocusLogs: (sessionId: string) => Promise<FocusLog[]>;
    saveFocusLog: (log: FocusLog) => Promise<void>;
    getSettings: () => Promise<Record<string, string>>;
    saveSetting: (key: string, value: string) => Promise<void>;
    exportData: () => Promise<string>;
  };
  activity: {
    getSystemIdleTime: () => Promise<number>;
    onWindowFocusChange: (callback: (focused: boolean) => void) => () => void;
  };
  notifications: {
    show: (title: string, body: string) => Promise<boolean>;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
