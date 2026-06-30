import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { speak } from '../../utils/speech';
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Camera, 
  Sliders, 
  Bell, 
  Accessibility, 
  Database, 
  ShieldAlert,
  Download,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';

const Settings: React.FC = () => {
  const { settings, updateSetting } = useApp();

  // Export DB content
  const handleExportData = async () => {
    try {
      const jsonDump = await window.electronAPI.db.exportData();
      
      // Create a text file download blob
      const blob = new Blob([jsonDump], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studyflow_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (settings.enableSpeech) {
        speak("Données exportées avec succès.");
      }
    } catch (e) {
      console.error('Failed to export data:', e);
      alert('Erreur lors de l\'exportation des données.');
    }
  };

  const handleMinChange = (val: number) => {
    updateSetting('minPomodoro', val);
    if (settings.maxPomodoro < val) {
      updateSetting('maxPomodoro', val);
    }
  };

  const handleMaxChange = (val: number) => {
    updateSetting('maxPomodoro', val);
    if (settings.minPomodoro > val) {
      updateSetting('minPomodoro', val);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-sans text-slate-800 dark:text-white">Paramètres de configuration</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configurez votre assistant de concentration et vos préférences d'accessibilité.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          
          {/* Section 1: Intelligent Tracking */}
          <div className="glass-panel rounded-2xl p-5 space-y-4 border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2 text-brand-purple">
              <Cpu size={16} />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-sans">MOTEUR D'INTELLIGENCE ARTIFICIELLE</span>
            </div>

            {/* Toggle AI */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 max-w-[80%]">
                <span className="text-xs font-semibold text-slate-800 dark:text-white">Adaptation IA Dynamique</span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Permet à StudyFlow de modifier la durée du Pomodoro selon votre niveau de concentration.</p>
              </div>
              <button
                onClick={() => {
                  const nextVal = !settings.enableAI;
                  updateSetting('enableAI', nextVal);
                  if (settings.enableSpeech) {
                    speak(nextVal ? "Adaptation par intelligence artificielle activée." : "Adaptation par intelligence artificielle désactivée.");
                  }
                }}
                className={`relative inline-flex h-5.5 w-10 items-center rounded-full transition-colors cursor-pointer ${settings.enableAI ? 'bg-brand-purple' : 'bg-slate-700'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${settings.enableAI ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Toggle Webcam */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 max-w-[80%]">
                <span className="text-xs font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Camera size={13} />
                  Analyse par Webcam
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Utilise la détection de visage en temps réel pour évaluer votre attention. Si désactivé, le suivi par activité clavier/souris prend le relais.</p>
              </div>
              <button
                onClick={() => {
                  const nextVal = !settings.enableWebcam;
                  updateSetting('enableWebcam', nextVal);
                  if (settings.enableSpeech) {
                    speak(nextVal ? "Analyse par webcam activée." : "Analyse par webcam désactivée.");
                  }
                }}
                className={`relative inline-flex h-5.5 w-10 items-center rounded-full transition-colors cursor-pointer ${settings.enableWebcam ? 'bg-brand-cyan' : 'bg-slate-700'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${settings.enableWebcam ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Section 2: Pomodoro Thresholds */}
          <div className="glass-panel rounded-2xl p-5 space-y-4 border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2 text-brand-blue">
              <Sliders size={16} />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-sans">LIMITES D'ADAPTATION DU POMODORO</span>
            </div>

            {/* Base Work Duration */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Temps de travail de base</span>
                <span className="font-semibold text-slate-800 dark:text-white">{settings.workDuration} min</span>
              </div>
              <input 
                type="range" 
                min="15" 
                max="50" 
                value={settings.workDuration} 
                onChange={(e) => updateSetting('workDuration', parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>

            {/* Base Break Duration */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Temps de pause de base</span>
                <span className="font-semibold text-slate-800 dark:text-white">{settings.breakDuration} min</span>
              </div>
              <input 
                type="range" 
                min="3" 
                max="15" 
                value={settings.breakDuration} 
                onChange={(e) => updateSetting('breakDuration', parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>

            {/* Range controls */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Durée minimale</label>
                <input 
                  type="number" 
                  min="10"
                  max="30"
                  value={settings.minPomodoro}
                  onChange={(e) => handleMinChange(parseInt(e.target.value, 10))}
                  className="glass-input w-full py-1.5 px-3 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Durée maximale</label>
                <input 
                  type="number" 
                  min="30"
                  max="60"
                  value={settings.maxPomodoro}
                  onChange={(e) => handleMaxChange(parseInt(e.target.value, 10))}
                  className="glass-input w-full py-1.5 px-3 text-xs"
                />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* Section 3: Interface & Accessibility */}
          <div className="glass-panel rounded-2xl p-5 space-y-4 border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2 text-brand-cyan">
              <Accessibility size={16} />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-sans">INTERFACE ET ACCESSIBILITÉ</span>
            </div>

            {/* Theme selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-white">Thème</span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    updateSetting('theme', 'system');
                    if (settings.enableSpeech) {
                      speak("Thème réglé sur Système.");
                    }
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all ${
                    settings.theme === 'system' 
                      ? 'bg-brand-cyan/20 border-brand-cyan/40 text-brand-cyan dark:text-brand-cyan-glow shadow-md shadow-brand-cyan/5' 
                      : 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-slate-900'
                  }`}
                >
                  <Laptop size={11} />
                  <span>Système</span>
                </button>
                <button
                  onClick={() => {
                    updateSetting('theme', 'dark');
                    if (settings.enableSpeech) {
                      speak("Thème réglé sur Sombre.");
                    }
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all ${
                    settings.theme === 'dark' 
                      ? 'bg-brand-purple/20 border-brand-purple/40 text-brand-purple dark:text-brand-purple-glow shadow-md shadow-brand-purple/5' 
                      : 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-slate-900'
                  }`}
                >
                  <Moon size={11} />
                  <span>Sombre</span>
                </button>
                <button
                  onClick={() => {
                    updateSetting('theme', 'light');
                    if (settings.enableSpeech) {
                      speak("Thème réglé sur Clair.");
                    }
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all ${
                    settings.theme === 'light' 
                      ? 'bg-brand-blue/20 border-brand-blue/40 text-brand-blue dark:text-brand-blue-glow shadow-md shadow-brand-blue/5' 
                      : 'border-black/5 dark:border-white/5 bg-black/5 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-slate-900'
                  }`}
                >
                  <Sun size={11} />
                  <span>Clair</span>
                </button>
              </div>
            </div>

            {/* Font Size slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Taille du texte</span>
                <span className="font-semibold text-slate-800 dark:text-white">{settings.fontSize} px</span>
              </div>
              <input 
                type="range" 
                min="12" 
                max="22" 
                value={settings.fontSize} 
                onChange={(e) => {
                  const nextVal = parseInt(e.target.value, 10);
                  updateSetting('fontSize', nextVal);
                  if (settings.enableSpeech) {
                    speak(`Taille du texte réglée à ${nextVal} pixels.`);
                  }
                }}
                className="w-full"
              />
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-white">Contraste Élevé</span>
                <p className="text-[10px] text-slate-550 dark:text-slate-550">Augmente le contraste des contours et des polices.</p>
              </div>
              <button
                onClick={() => {
                  const nextVal = !settings.highContrast;
                  updateSetting('highContrast', nextVal);
                  if (settings.enableSpeech) {
                    speak(nextVal ? "Contraste élevé activé." : "Contraste élevé désactivé.");
                  }
                }}
                className={`relative inline-flex h-5.5 w-10 items-center rounded-full transition-colors cursor-pointer ${settings.highContrast ? 'bg-brand-cyan' : 'bg-slate-700'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${settings.highContrast ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Voice Help */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Cpu size={13} />
                  Aide Vocale (Synthèse)
                </span>
                <p className="text-[10px] text-slate-550 dark:text-slate-500">Annoncer vocalement les onglets, le minuteur et les alertes (pour malvoyants).</p>
              </div>
              <button
                onClick={() => {
                  const nextVal = !settings.enableSpeech;
                  updateSetting('enableSpeech', nextVal);
                  speak(nextVal ? "Aide vocale activée." : "Aide vocale désactivée.");
                }}
                className={`relative inline-flex h-5.5 w-10 items-center rounded-full transition-colors cursor-pointer ${settings.enableSpeech ? 'bg-brand-purple' : 'bg-slate-700'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${settings.enableSpeech ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Bell size={13} />
                  Notifications Desktop
                </span>
                <p className="text-[10px] text-slate-550 dark:text-slate-500">Envoyer des alertes système à la fin des cycles.</p>
              </div>
              <button
                onClick={() => {
                  const nextVal = !settings.enableNotifications;
                  updateSetting('enableNotifications', nextVal);
                  if (settings.enableSpeech) {
                    speak(nextVal ? "Notifications de bureau activées." : "Notifications de bureau désactivées.");
                  }
                }}
                className={`relative inline-flex h-5.5 w-10 items-center rounded-full transition-colors cursor-pointer ${settings.enableNotifications ? 'bg-brand-purple' : 'bg-slate-700'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${settings.enableNotifications ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Section 4: Data Management & Privacy Notice */}
          <div className="glass-panel rounded-2xl p-5 space-y-4 border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2 text-amber-500">
              <Database size={16} />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-sans">GESTION DES DONNÉES & CONFIDENTIALITÉ</span>
            </div>

            {/* Export data */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-white">Sauvegarder et Exporter</span>
                <p className="text-[10px] text-slate-550 dark:text-slate-500">Téléchargez une sauvegarde JSON contenant vos tâches et sessions.</p>
              </div>
              <button
                onClick={handleExportData}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-black/5 dark:bg-slate-900 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-slate-800 text-slate-700 dark:text-white transition-colors cursor-pointer"
              >
                <Download size={13} />
                <span>Exporter</span>
              </button>
            </div>

            {/* Privacy notice banner */}
            <div className="p-3 bg-brand-cyan/5 border border-brand-cyan/20 rounded-xl flex gap-2.5 items-start">
              <ShieldAlert size={16} className="text-brand-cyan shrink-0 mt-0.5" />
              <div className="space-y-1 text-[10px] leading-normal text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">Vos données restent sur votre appareil.</span>
                <p>StudyFlow utilise une base de données SQLite 100% locale stockée dans le dossier applicatif sécurisé. Aucun flux vidéo n'est enregistré ni téléversé vers un serveur tiers ou le cloud.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Settings;
