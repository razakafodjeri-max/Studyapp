import React, { useEffect } from 'react';
import { useApp } from './contexts/AppContext';
import { useTimer } from './contexts/TimerContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  BarChart3, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Minus, 
  Square, 
  X,
  Keyboard,
  HelpCircle
} from 'lucide-react';

// Import our views (we will create these next)
import Dashboard from './components/dashboard/Dashboard';
import Tasks from './components/tasks/Tasks';
import Analytics from './components/analytics/Analytics';
import Settings from './components/settings/Settings';
import Onboarding from './components/onboarding/Onboarding';
import Guide from './components/guide/Guide';
import { speak } from './utils/speech';

const App: React.FC = () => {
  const { currentTab, setCurrentTab, settings, updateSetting, resolvedTheme } = useApp();
  const { startTimer, pauseTimer, resetTimer, skipSession, isActive, mode, announceRemainingTime } = useTimer();

  // Annonce vocale du changement d'onglet
  useEffect(() => {
    if (settings.enableSpeech) {
      const tabNames: Record<string, string> = {
        dashboard: "Tableau de bord",
        tasks: "Tâches",
        analytics: "Analytiques",
        settings: "Paramètres",
        guide: "Guide et foire aux questions"
      };
      const name = tabNames[currentTab];
      if (name) speak(name);
    }
  }, [currentTab, settings.enableSpeech]);

  // Listen to global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcut if the user is typing in an input
      const activeElement = document.activeElement;
      const isInput = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.getAttribute('contenteditable') === 'true'
      );
      if (isInput) return;

      // Space: Toggle Timer
      if (e.code === 'Space') {
        e.preventDefault();
        if (isActive) {
          pauseTimer();
        } else {
          startTimer();
        }
      }

      // Keyboard navigation shortcuts: Ctrl/Cmd + Shift + ...
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        const key = e.key.toLowerCase();
        
        // Actions
        if (key === 'r') {
          e.preventDefault();
          resetTimer();
        } else if (key === 'x') {
          e.preventDefault();
          skipSession();
        } else if (key === 'n') {
          e.preventDefault();
          updateSetting('enableNotifications', !settings.enableNotifications);
          if (settings.enableSpeech) {
            speak(!settings.enableNotifications ? "Notifications activées." : "Notifications désactivées.");
          }
        } else if (key === 'h') {
          e.preventDefault();
          updateSetting('highContrast', !settings.highContrast);
          if (settings.enableSpeech) {
            speak(!settings.highContrast ? "Contraste élevé activé." : "Contraste élevé désactivé.");
          }
        } else if (key === 'v') {
          e.preventDefault();
          updateSetting('enableSpeech', !settings.enableSpeech);
          speak(!settings.enableSpeech ? "Aide vocale activée." : "Aide vocale désactivée.");
        } else if (key === 'u') {
          e.preventDefault();
          announceRemainingTime();
        }
        // Navigation
        else if (key === 'd') {
          e.preventDefault();
          setCurrentTab('dashboard');
        } else if (key === 't') {
          e.preventDefault();
          setCurrentTab('tasks');
        } else if (key === 'a') {
          e.preventDefault();
          setCurrentTab('analytics');
        } else if (key === 'g') {
          e.preventDefault();
          setCurrentTab('guide');
        } else if (key === 's') {
          e.preventDefault();
          setCurrentTab('settings');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, startTimer, pauseTimer, resetTimer, skipSession, settings, updateSetting, setCurrentTab, announceRemainingTime]);

  // Exclude sidebar and titlebar during onboarding
  if (currentTab === 'onboarding') {
    return <Onboarding />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'Ctrl+Shift+D' },
    { id: 'tasks', label: 'Tâches', icon: CheckSquare, shortcut: 'Ctrl+Shift+T' },
    { id: 'analytics', label: 'Analytiques', icon: BarChart3, shortcut: 'Ctrl+Shift+A' },
    { id: 'guide', label: 'Guide & FAQ', icon: HelpCircle, shortcut: 'Ctrl+Shift+G' },
    { id: 'settings', label: 'Paramètres', icon: SettingsIcon, shortcut: 'Ctrl+Shift+S' },
  ] as const;

  return (
    <div className={`flex flex-col h-screen overflow-hidden text-slate-800 dark:text-slate-100 ${resolvedTheme}`}>
      
      {/* 🛠️ Custom Titlebar */}
      <header className="titlebar-drag flex items-center justify-between h-10 px-4 bg-slate-100/80 dark:bg-slate-950/90 border-b border-black/5 dark:border-white/5 select-none z-50">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-md bg-gradient-to-tr from-brand-blue to-brand-cyan shadow-sm animate-pulse-glow" />
          <span className="text-xs font-semibold tracking-wider font-sans text-slate-700 dark:text-slate-300">STUDYFLOW</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-purple/20 text-brand-purple dark:text-brand-purple-glow font-medium border border-brand-purple/15 ml-1">v1.0.0</span>
        </div>

        {/* Window controls */}
        <div className="titlebar-nodrag flex items-center gap-1">
          <button 
            onClick={() => window.electronAPI.window.minimize()}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            title="Minimiser"
          >
            <Minus size={13} />
          </button>
          <button 
            onClick={() => window.electronAPI.window.maximize()}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            title="Agrandir"
          >
            <Square size={11} />
          </button>
          <button 
            onClick={() => window.electronAPI.window.close()}
            className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Fermer"
          >
            <X size={13} />
          </button>
        </div>
      </header>

      {/* 🚀 Main Interface Grid */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className="w-64 glass-panel border-r border-black/5 dark:border-white/5 flex flex-col justify-between p-4 z-40 select-none">
          <div className="space-y-6">
            {/* Header / Brand */}
            <div className="px-2 py-4 border-b border-black/5 dark:border-white/5">
              <h2 className="text-lg font-bold font-sans tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-brand-blue via-brand-purple to-brand-cyan">
                StudyFlow
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Assistant Pomodoro Adaptatif</p>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActiveTab = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActiveTab 
                        ? 'bg-gradient-to-r from-brand-blue/15 to-brand-purple/15 text-slate-800 dark:text-slate-100 border border-brand-purple/20 shadow-md shadow-brand-purple/5'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-black/5 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={`transition-transform duration-200 group-hover:scale-110 ${isActiveTab ? 'text-brand-purple dark:text-brand-purple-glow' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'}`} />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 bg-black/5 dark:bg-slate-950/40 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                      {item.shortcut.split('+')[2]}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer Info */}
          <div className="space-y-3 pt-4 border-t border-black/5 dark:border-white/5">
            {/* Keyboard Shortcuts Prompt */}
            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 px-2 py-1 bg-black/5 dark:bg-slate-950/20 rounded-lg">
              <Keyboard size={12} />
              <span><kbd className="font-mono bg-black/10 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 px-1 py-0.5 rounded">Espace</kbd> pour pause</span>
            </div>

            {/* Privacy Shield */}
            <div className="flex items-center gap-2 text-xs text-brand-cyan dark:text-brand-cyan-glow font-medium px-2 py-1">
              <ShieldCheck size={14} className="text-brand-cyan" />
              <span>Données 100% locales</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal px-2">
              Vos images de caméra ne sont pas stockées et aucune donnée ne quitte cet appareil.
            </p>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 overflow-y-auto bg-brand-bgLight dark:bg-brand-bgDark text-slate-800 dark:text-slate-200 p-6 md:p-8 relative">
          {/* Animated Background blur balls for beautiful glassmorphism style */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/15 dark:bg-brand-purple/10 rounded-full blur-[100px] pointer-events-none -z-10" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-blue/15 dark:bg-brand-blue/10 rounded-full blur-[100px] pointer-events-none -z-10" />

          {/* Tab switching */}
          <div className="fade-in h-full">
            {currentTab === 'dashboard' && <Dashboard />}
            {currentTab === 'tasks' && <Tasks />}
            {currentTab === 'analytics' && <Analytics />}
            {currentTab === 'guide' && <Guide />}
            {currentTab === 'settings' && <Settings />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
