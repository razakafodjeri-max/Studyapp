import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useTimer, FocusStatus } from '../../contexts/TimerContext';
import { generateFocusRecommendations } from '../../utils/advisor';
import { classifyWebcamFocus } from '../../utils/faceDetection';
import { Session } from '../../main/db';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Activity, 
  Camera, 
  CameraOff, 
  Brain, 
  Clock, 
  CheckCircle,
  HelpCircle,
  Trash2,
  Bell
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { settings, tasks, updateSetting } = useApp();
  const {
    timeLeft,
    duration,
    isActive,
    mode,
    focusStatus,
    focusScore,
    currentSessionId,
    startTimer,
    pauseTimer,
    resetTimer,
    skipSession,
    setFocusStatus,
    adaptiveAdvice,
    cameraStream,
    setCustomDuration
  } = useTimer();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [adviceList, setAdviceList] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webCamCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Load completed sessions
  useEffect(() => {
    async function loadSessions() {
      try {
        const dbSessions = await window.electronAPI.db.getSessions();
        setSessions(dbSessions || []);
      } catch (e) {
        console.error('Failed to load sessions:', e);
      }
    }
    loadSessions();
  }, [currentSessionId, isActive]);

  // Generate recommendations
  useEffect(() => {
    const tips = generateFocusRecommendations(sessions, focusScore, mode);
    setAdviceList(tips);
  }, [sessions, focusScore, mode]);

  // Sync stream to local hidden video
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Canvas drawing loop removed for performance optimization. Renders directly via HTML5 Video now.

  // Delete session handler
  const handleDeleteSession = async (id: number) => {
    if (confirm('Voulez-vous supprimer cette session de l\'historique ?')) {
      try {
        await window.electronAPI.db.deleteSession(id);
        const dbSessions = await window.electronAPI.db.getSessions();
        setSessions(dbSessions || []);
      } catch (e) {
        console.error('Failed to delete session:', e);
      }
    }
  };

  // Format digital clock
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remain = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remain.toString().padStart(2, '0')}`;
  };

  // SVG Radial progress calculations
  const progressRatio = timeLeft / (duration || 1);
  const radius = 120;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progressRatio * circumference;

  // Aggregate stats for dashboard
  const today = new Date().toDateString();
  const todaySessions = sessions.filter(s => new Date(s.startTime).toDateString() === today);
  const totalWorkSecs = todaySessions
    .filter(s => s.type === 'work' && !s.interrupted)
    .reduce((a, b) => a + b.durationSeconds, 0);
  const totalWorkMins = Math.round(totalWorkSecs / 60);

  const completedTodayTasks = tasks.filter(t => t.completed).length;
  const totalTodayTasks = tasks.length;

  const todayScores = todaySessions.filter(s => s.type === 'work').map(s => s.focusScore);
  const globalDailyScore = todayScores.length > 0 
    ? Math.round(todayScores.reduce((a, b) => a + b, 0) / todayScores.length)
    : 100;

  // Determine status circle color
  const getStatusColor = (status: FocusStatus) => {
    if (status === 'focused') return 'bg-emerald-500 shadow-emerald-500/50';
    if (status === 'distracted') return 'bg-amber-500 shadow-amber-500/50';
    return 'bg-rose-500 shadow-rose-500/50';
  };

  const getStatusLabel = (status: FocusStatus) => {
    if (status === 'focused') return 'Concentré';
    if (status === 'distracted') return 'Distrait';
    return 'Absent';
  };

  return (
    <div className="space-y-6 h-full flex flex-col justify-between">
      
      {/* Dashboard Header & Quick Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-800 dark:text-white">Tableau de bord</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Suivi en temps réel de votre concentration.</p>
        </div>
        
        {/* Quick actions: Notifications toggle */}
        <div className="flex items-center gap-3 bg-black/5 dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-2xl px-4 py-2 self-start sm:self-auto">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 select-none">
            <Bell size={12} className={settings.enableNotifications ? 'text-brand-purple dark:text-brand-purple-glow animate-bounce' : 'text-slate-400'} />
            Notifications
          </span>
          <button
            onClick={() => updateSetting('enableNotifications', !settings.enableNotifications)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${settings.enableNotifications ? 'bg-brand-purple' : 'bg-slate-700'}`}
            title={settings.enableNotifications ? "Désactiver les notifications" : "Activer les notifications"}
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${settings.enableNotifications ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* 📊 Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Stat 1: Focus Score */}
        <div className="glass-card p-5 flex items-center justify-between glow-purple">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Score de Concentration</span>
            <h3 className="text-3xl font-bold font-sans tracking-tight text-slate-800 dark:text-white">{globalDailyScore}%</h3>
            <p className="text-[10px] text-slate-500">Moyenne quotidienne locale</p>
          </div>
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="28" cy="28" r="24" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="4" fill="transparent" />
              <circle 
                cx="28" cy="28" r="24" 
                className="stroke-brand-purple" 
                strokeWidth="4" 
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - globalDailyScore / 100)}`}
              />
            </svg>
            <Brain size={16} className="absolute text-brand-purple dark:text-brand-purple-glow" />
          </div>
        </div>

        {/* Stat 2: Focus Time */}
        <div className="glass-card p-5 flex items-center justify-between glow-blue">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Temps Productif</span>
            <h3 className="text-3xl font-bold font-sans tracking-tight text-slate-800 dark:text-white">
              {totalWorkMins >= 60 
                ? `${Math.floor(totalWorkMins / 60)}h ${totalWorkMins % 60}m` 
                : `${totalWorkMins} min`}
            </h3>
            <p className="text-[10px] text-slate-500">Sessions complétées aujourd'hui</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-brand-blue/10 border border-brand-blue/15 text-brand-blue dark:text-brand-blue-glow">
            <Clock size={20} />
          </div>
        </div>

        {/* Stat 3: Tasks Completed */}
        <div className="glass-card p-5 flex items-center justify-between glow-cyan">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tâches Terminées</span>
            <h3 className="text-3xl font-bold font-sans tracking-tight text-slate-800 dark:text-white">{completedTodayTasks} / {totalTodayTasks}</h3>
            <p className="text-[10px] text-slate-500">Objectifs de la journée</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/15 text-brand-cyan dark:text-brand-cyan-glow">
            <CheckCircle size={20} />
          </div>
        </div>
      </div>

      {/* 🚀 Main Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch flex-1 my-4">
        
        {/* Left Column: Radial Timer Widget */}
        <div className="lg:col-span-3 glass-card flex flex-col items-center justify-center p-6 md:p-8 space-y-6">
          <div className="relative flex items-center justify-center w-64 h-64 select-none">
            {/* SVG Circular Timer Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                stroke="rgba(0, 0, 0, 0.03)"
                className="dark:stroke-white/[0.03]"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke={mode === 'work' ? 'url(#timerGradWork)' : 'url(#timerGradBreak)'}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              
              {/* Define gradients */}
              <defs>
                <linearGradient id="timerGradWork" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="timerGradBreak" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Digital Clock */}
            <div className="absolute flex flex-col items-center justify-center text-center space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">
                {mode === 'work' ? 'Concentration' : 'Pause'}
              </span>
              <span className="text-4xl md:text-5xl font-extrabold font-mono tracking-tight text-slate-800 dark:text-white">
                {formatTime(timeLeft)}
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/5 dark:bg-slate-950/40 border border-black/5 dark:border-white/5">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(isActive ? focusStatus : 'focused')} shadow-sm`} />
                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  {isActive ? getStatusLabel(focusStatus) : 'En attente'}
                </span>
              </div>
            </div>
          </div>

          {/* Custom Duration Selector (Visible only when inactive) */}
          {!isActive && (
            <div className="flex items-center gap-3 bg-black/5 dark:bg-slate-950/40 border border-black/5 dark:border-white/5 rounded-2xl px-4 py-1.5 select-none animate-fadeIn">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Durée :</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const currentMins = Math.round(duration / 60);
                    if (currentMins > 1) {
                      setCustomDuration(currentMins - 1);
                    }
                  }}
                  className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={Math.round(duration / 60)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val > 0) {
                      setCustomDuration(val);
                    }
                  }}
                  className="bg-transparent text-center w-12 text-sm font-bold font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => {
                    const currentMins = Math.round(duration / 60);
                    if (currentMins < 180) {
                      setCustomDuration(currentMins + 1);
                    }
                  }}
                  className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">min</span>
            </div>
          )}

          {/* Controls Bar */}
          <div className="flex items-center gap-4">
            <button
              onClick={resetTimer}
              className="p-3 rounded-xl bg-black/5 dark:bg-slate-900/50 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors"
              title="Réinitialiser"
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={isActive ? pauseTimer : startTimer}
              className={`p-4 rounded-2xl text-white transition-all shadow-xl hover:scale-105 active:scale-95 ${
                isActive 
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/10' 
                  : 'bg-gradient-to-r from-brand-blue via-brand-purple to-brand-cyan hover:opacity-90 shadow-brand-purple/10'
              }`}
            >
              {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>

            <button
              onClick={skipSession}
              disabled={!isActive}
              className={`p-3 rounded-xl bg-black/5 dark:bg-slate-900/50 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors ${
                !isActive ? 'opacity-30 cursor-not-allowed' : ''
              }`}
              title="Passer"
            >
              <SkipForward size={16} />
            </button>
          </div>

          {/* Adaptive Engine Alert banner */}
          <div className="w-full text-center px-4 py-2 bg-black/5 dark:bg-slate-950/20 border border-black/5 dark:border-white/5 rounded-xl">
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              🤖 "{adaptiveAdvice}"
            </p>
          </div>
        </div>

        {/* Right Column: AI Live monitor and scrolling advice */}
        <div className="lg:col-span-2 flex flex-col justify-between space-y-6">
          
          {/* Webcam Face Tracker Box */}
          <div className="glass-card p-5 space-y-4 flex flex-col items-center justify-between flex-1">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-brand-purple dark:text-brand-purple-glow" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Moniteur de Concentration IA</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {settings.enableWebcam && settings.enableAI ? 'Webcam active' : 'Mode activité'}
              </span>
            </div>

            {/* Render Video Mirror or Activity waves */}
            <div className={`w-full flex-1 aspect-video rounded-xl bg-slate-950/60 border transition-all duration-300 flex items-center justify-center overflow-hidden relative ${
              isActive && mode === 'work' && settings.enableWebcam && settings.enableAI
                ? (focusStatus === 'focused'
                    ? 'border-brand-cyan/40 glow-cyan'
                    : focusStatus === 'distracted'
                      ? 'border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'border-rose-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]')
                : 'border-black/5 dark:border-white/5'
            }`}>
              {isActive && mode === 'work' && settings.enableWebcam && settings.enableAI ? (
                <>
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1] rounded-xl"
                  />
                  {/* Glowing dynamic CSS scan ring target HUD overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`w-16 h-16 rounded-full border-2 border-dashed animate-spin transition-colors duration-500 ${
                      focusStatus === 'focused'
                        ? 'border-brand-cyan/80 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : focusStatus === 'distracted'
                          ? 'border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                          : 'border-rose-500/80 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                    }`} style={{ animationDuration: '10s' }} />
                    <div className={`absolute w-2 h-2 rounded-full transition-colors duration-500 ${
                      focusStatus === 'focused'
                        ? 'bg-brand-cyan'
                        : focusStatus === 'distracted'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                    }`} />
                  </div>
                </>
              ) : isActive && mode === 'work' ? (
                // Camera-less Activity Graph waves
                <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400 p-6 text-center select-none">
                  <Activity size={28} className="text-brand-cyan animate-pulse" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Suivi d'activité en cours</span>
                  <span className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">
                    Analyse des pressions de touches, mouvements de souris et changements de fenêtres.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-600">
                  <CameraOff size={24} />
                  <span className="text-[10px] font-semibold">Analyse inactive</span>
                </div>
              )}
            </div>

            {/* Realtime scoring bar */}
            <div className="w-full space-y-1">
              <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400">
                <span>Concentration de la session</span>
                <span className="font-bold text-brand-purple dark:text-brand-purple-glow">{focusScore}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800/60 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-blue to-brand-purple transition-all duration-300" 
                  style={{ width: `${focusScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* AI Tips Panel */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-brand-purple dark:text-brand-purple-glow" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-sans">Conseils & Suggestions IA</span>
            </div>
            
            <div className="space-y-2">
              {adviceList.map((advice, i) => (
                <div key={i} className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 border-l-2 border-brand-purple/30 pl-2.5 py-0.5">
                  {advice}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 📜 Bottom Row: Today's History */}
      <div className="glass-card p-5 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">Sessions Récentes (Aujourd'hui)</h4>
        
        {todaySessions.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic">Aucune session enregistrée aujourd'hui. Démarrez le minuteur pour commencer !</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5 text-[10px] text-slate-500 uppercase tracking-wider">
                  <th className="py-2">Type</th>
                  <th className="py-2">Heure</th>
                  <th className="py-2">Durée</th>
                  <th className="py-2">Score Focus</th>
                  <th className="py-2">Statut</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 text-[11px] text-slate-600 dark:text-slate-400">
                {todaySessions.slice(0, 3).map((session) => {
                  const startTime = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const mins = Math.round(session.durationSeconds / 60);
                  return (
                    <tr key={session.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 font-semibold text-slate-800 dark:text-white">
                        {session.type === 'work' ? '💻 Concentration' : '☕ Pause'}
                      </td>
                      <td className="py-2.5">{startTime}</td>
                      <td className="py-2.5">{mins} min</td>
                      <td className="py-2.5">
                        {session.type === 'work' ? `${session.focusScore}%` : '-'}
                      </td>
                      <td className="py-2.5 font-medium">
                        {session.interrupted ? (
                          <span className="text-rose-500 dark:text-rose-400">Interrompu</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">Complété</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-medium">
                        <button
                          onClick={() => handleDeleteSession(session.id!)}
                          className="p-1 rounded hover:bg-red-500/10 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="Supprimer la session"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
