import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task } from '../../main/db';

export type TabType = 'dashboard' | 'tasks' | 'analytics' | 'settings' | 'onboarding' | 'guide';

interface AppSettings {
  onboarded: boolean;
  theme: 'dark' | 'light' | 'system';
  enableAI: boolean;
  enableWebcam: boolean;
  minPomodoro: number;
  maxPomodoro: number;
  workDuration: number;
  breakDuration: number;
  enableNotifications: boolean;
  fontSize: number;
  highContrast: boolean;
  enableSpeech: boolean;
}

interface AppContextType {
  settings: AppSettings;
  updateSetting: (key: keyof AppSettings, value: any) => Promise<void>;
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  tasks: Task[];
  loadTasks: () => Promise<void>;
  saveTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  isLoading: boolean;
  resolvedTheme: 'dark' | 'light';
}

const defaultSettings: AppSettings = {
  onboarded: false,
  theme: 'system',
  enableAI: true,
  enableWebcam: true,
  minPomodoro: 15,
  maxPomodoro: 50,
  workDuration: 25,
  breakDuration: 5,
  enableNotifications: true,
  fontSize: 16,
  highContrast: false,
  enableSpeech: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings and tasks from database on startup
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        // Load settings
        const dbSettings = await window.electronAPI.db.getSettings();
        const loadedSettings = { ...defaultSettings };
        
        if (dbSettings) {
          if (dbSettings.onboarded) loadedSettings.onboarded = dbSettings.onboarded === 'true';
          if (dbSettings.theme) loadedSettings.theme = dbSettings.theme as 'dark' | 'light' | 'system';
          if (dbSettings.enableAI) loadedSettings.enableAI = dbSettings.enableAI === 'true';
          if (dbSettings.enableWebcam) loadedSettings.enableWebcam = dbSettings.enableWebcam === 'true';
          if (dbSettings.minPomodoro) loadedSettings.minPomodoro = parseInt(dbSettings.minPomodoro, 10);
          if (dbSettings.maxPomodoro) loadedSettings.maxPomodoro = parseInt(dbSettings.maxPomodoro, 10);
          if (dbSettings.workDuration) loadedSettings.workDuration = parseInt(dbSettings.workDuration, 10);
          if (dbSettings.breakDuration) loadedSettings.breakDuration = parseInt(dbSettings.breakDuration, 10);
          if (dbSettings.enableNotifications) loadedSettings.enableNotifications = dbSettings.enableNotifications === 'true';
          if (dbSettings.fontSize) loadedSettings.fontSize = parseInt(dbSettings.fontSize, 10);
          if (dbSettings.highContrast) loadedSettings.highContrast = dbSettings.highContrast === 'true';
          if (dbSettings.enableSpeech) loadedSettings.enableSpeech = dbSettings.enableSpeech === 'true';
        }

        setSettings(loadedSettings);
        
        // Redirect to onboarding if not done yet
        if (!loadedSettings.onboarded) {
          setCurrentTab('onboarding');
        }

        // Load tasks
        const dbTasks = await window.electronAPI.db.getTasks();
        setTasks(dbTasks || []);
      } catch (err) {
        console.error('Failed to initialize app settings/tasks:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Update theme class on HTML element
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = (t: 'dark' | 'light') => {
      setResolvedTheme(t);
      if (t === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };

    if (settings.theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(media.matches ? 'dark' : 'light');

      const listener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      applyTheme(settings.theme);
    }
  }, [settings.theme]);

  // Apply font size and contrast styling globally
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${settings.fontSize}px`;
    
    if (settings.highContrast) {
      root.classList.add('contrast-125');
    } else {
      root.classList.remove('contrast-125');
    }
  }, [settings.fontSize, settings.highContrast]);

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    try {
      const stringValue = String(value);
      await window.electronAPI.db.saveSetting(key, stringValue);
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
    } catch (e) {
      console.error(`Error saving setting ${key}:`, e);
    }
  };

  const loadTasks = async () => {
    try {
      const dbTasks = await window.electronAPI.db.getTasks();
      setTasks(dbTasks || []);
    } catch (e) {
      console.error('Error reloading tasks:', e);
    }
  };

  const saveTask = async (task: Task) => {
    try {
      await window.electronAPI.db.saveTask(task);
      await loadTasks();
    } catch (e) {
      console.error('Error saving task:', e);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await window.electronAPI.db.deleteTask(id);
      await loadTasks();
    } catch (e) {
      console.error('Error deleting task:', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSetting,
        currentTab,
        setCurrentTab,
        tasks,
        loadTasks,
        saveTask,
        deleteTask,
        isLoading,
        resolvedTheme
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
