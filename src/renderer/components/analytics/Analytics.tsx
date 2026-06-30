import React, { useEffect, useState } from 'react';
import { Session, FocusLog } from '../../main/db';
import { useApp } from '../../contexts/AppContext';
import { speak } from '../../utils/speech';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Activity, 
  Calendar, 
  Briefcase,
  Plus,
  Trash2,
  X
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics: React.FC = () => {
  const { settings } = useApp();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [focusLogs, setFocusLogs] = useState<FocusLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Manual Session states
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [manualDuration, setManualDuration] = useState(25);
  const [manualType, setManualType] = useState<'work' | 'break'>('work');
  const [manualScore, setManualScore] = useState(85);

  // Fetch all logs & sessions
  useEffect(() => {
    async function loadAnalyticsData() {
      try {
        setIsLoading(true);
        const dbSessions = await window.electronAPI.db.getSessions();
        const loadedSessions = dbSessions || [];
        setSessions(loadedSessions);

        // Fetch logs for the last 5 sessions to aggregate focus statuses
        const recentLogs: FocusLog[] = [];
        const workSessions = loadedSessions.filter(s => s.type === 'work').slice(0, 5);
        for (const s of workSessions) {
          if (s.id) {
            const logs = await window.electronAPI.db.getFocusLogs(String(s.id));
            if (logs) recentLogs.push(...logs);
          }
        }
        setFocusLogs(recentLogs);
      } catch (e) {
        console.error('Error fetching analytics data:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalyticsData();
  }, []);

  // Delete session handler
  const handleDeleteSession = async (id: number) => {
    if (confirm('Voulez-vous supprimer cette session de l\'historique ?')) {
      try {
        await window.electronAPI.db.deleteSession(id);
        const dbSessions = await window.electronAPI.db.getSessions();
        const loadedSessions = dbSessions || [];
        setSessions(loadedSessions);

        // Re-aggregate logs
        const recentLogs: FocusLog[] = [];
        const workSess = loadedSessions.filter(s => s.type === 'work').slice(0, 5);
        for (const s of workSess) {
          if (s.id) {
            const logs = await window.electronAPI.db.getFocusLogs(String(s.id));
            if (logs) recentLogs.push(...logs);
          }
        }
        setFocusLogs(recentLogs);
      } catch (err) {
        console.error('Failed to delete session:', err);
      }
    }
  };

  // Save manual session handler
  const handleSaveManualSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startDt = new Date(`${manualDate}T${manualTime}`);
      const endDt = new Date(startDt.getTime() + manualDuration * 60 * 1000);

      const newSession: Session = {
        startTime: startDt.toISOString(),
        endTime: endDt.toISOString(),
        type: manualType,
        durationSeconds: manualDuration * 60,
        focusScore: manualType === 'work' ? manualScore : 100,
        cameraUsed: false,
        interrupted: false
      };

      await window.electronAPI.db.saveSession(newSession);
      setIsManualModalOpen(false);

      // Refresh data
      const dbSessions = await window.electronAPI.db.getSessions();
      const loadedSessions = dbSessions || [];
      setSessions(loadedSessions);

      const recentLogs: FocusLog[] = [];
      const workSess = loadedSessions.filter(s => s.type === 'work').slice(0, 5);
      for (const s of workSess) {
        if (s.id) {
          const logs = await window.electronAPI.db.getFocusLogs(String(s.id));
          if (logs) recentLogs.push(...logs);
        }
      }
      setFocusLogs(recentLogs);
    } catch (err) {
      console.error('Failed to create manual session:', err);
    }
  };

  // 1. Calculate General Aggregates
  const workSessions = sessions.filter(s => s.type === 'work');
  const completedWorkSessions = workSessions.filter(s => !s.interrupted);
  
  // Total work minutes
  const totalWorkSecs = completedWorkSessions.reduce((a, b) => a + b.durationSeconds, 0);
  const totalWorkMins = Math.round(totalWorkSecs / 60);

  // Focus Score average
  const avgFocusScore = completedWorkSessions.length > 0
    ? Math.round(completedWorkSessions.reduce((a, b) => a + b.focusScore, 0) / completedWorkSessions.length)
    : 100;

  // Completion rate
  const completionRate = workSessions.length > 0
    ? Math.round((completedWorkSessions.length / workSessions.length) * 100)
    : 0;

  // 2. Aggregate Focus Status distributions (Focused vs Distracted vs Absent)
  // Each log sample is 5 seconds of work. Let's count them
  let focusedCount = 0;
  let distractedCount = 0;
  let absentCount = 0;

  focusLogs.forEach(log => {
    if (log.status === 'focused') focusedCount++;
    else if (log.status === 'distracted') distractedCount++;
    else if (log.status === 'absent') absentCount++;
  });

  const totalLogs = focusedCount + distractedCount + absentCount;
  // Convert samples to minutes (each sample = 5s -> 12 samples = 1 minute)
  const focusedMins = Math.round((focusedCount * 5) / 60);
  const distractedMins = Math.round((distractedCount * 5) / 60);
  const absentMins = Math.round((absentCount * 5) / 60);

  // Speech feedback for visually impaired users when loading stats
  useEffect(() => {
    if (!isLoading && settings.enableSpeech) {
      const text = `Section statistiques. Vous avez accumulé ${totalWorkMins} minutes de concentration. Votre score de concentration moyen est de ${avgFocusScore} pour cent. Le taux de complétion de vos sessions de travail est de ${completionRate} pour cent.`;
      speak(text);
    }
  }, [isLoading, settings.enableSpeech, totalWorkMins, avgFocusScore, completionRate]);

  // 3. Prepare Line Chart: Focus score evolution (last 7 work sessions)
  const recentWorkSessions = [...workSessions].reverse().slice(-7);
  const lineChartData = {
    labels: recentWorkSessions.map((_, idx) => `Session ${idx + 1}`),
    datasets: [
      {
        fill: true,
        label: 'Score Focus (%)',
        data: recentWorkSessions.map(s => s.focusScore),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        tension: 0.4,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Outfit' },
        bodyFont: { family: 'Outfit' },
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { family: 'Outfit' } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { family: 'Outfit' } }
      }
    }
  };

  // 4. Prepare Bar Chart: Daily focus time breakdown (Focused vs Distracted vs Absent in minutes)
  const barChartData = {
    labels: ['Temps Productif', 'Temps Distrait', 'Temps Absent'],
    datasets: [
      {
        label: 'Minutes',
        data: [
          focusedMins || (totalWorkMins > 0 ? Math.round(totalWorkMins * 0.8) : 0), 
          distractedMins || (totalWorkMins > 0 ? Math.round(totalWorkMins * 0.15) : 0), 
          absentMins || (totalWorkMins > 0 ? Math.round(totalWorkMins * 0.05) : 0)
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.65)', // emerald
          'rgba(245, 158, 11, 0.65)', // amber
          'rgba(239, 68, 68, 0.65)'   // rose
        ],
        borderColor: [
          '#10b981',
          '#f59e0b',
          '#ef4444'
        ],
        borderWidth: 1.5,
        borderRadius: 8
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Outfit' },
        bodyFont: { family: 'Outfit' }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { family: 'Outfit' } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { family: 'Outfit' } }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm">
        <span>Chargement des statistiques...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-white">Dashboard Analytique</h2>
          <p className="text-xs text-slate-400">Rapports de performance de concentration générés localement.</p>
        </div>
        <button
          onClick={() => {
            setManualDate(new Date().toISOString().split('T')[0]);
            setManualTime(new Date().toTimeString().split(' ')[0].substring(0, 5));
            setManualDuration(25);
            setManualType('work');
            setManualScore(85);
            setIsManualModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-white bg-black/5 dark:bg-slate-900 border border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-slate-800 transition-all shadow-md cursor-pointer self-start md:self-auto"
        >
          <Plus size={14} />
          <span>Saisir une session</span>
        </button>
      </div>

      {/* 📊 KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Metric 1: Avg Focus Score */}
        <div className="glass-card p-4 space-y-2 border border-black/5 dark:border-white/5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Score Focus Moyen</span>
            <Award size={14} className="text-brand-purple dark:text-brand-purple-glow" />
          </div>
          <div>
            <h4 className="text-2xl font-bold font-sans text-slate-850 dark:text-white">{avgFocusScore}%</h4>
            <p className="text-[9px] text-slate-500">Tendance globale</p>
          </div>
        </div>

        {/* Metric 2: Total Work Hours */}
        <div className="glass-card p-4 space-y-2 border border-black/5 dark:border-white/5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Temps Concentré</span>
            <Briefcase size={14} className="text-brand-blue dark:text-brand-blue-glow" />
          </div>
          <div>
            <h4 className="text-2xl font-bold font-sans text-slate-850 dark:text-white">
              {totalWorkMins >= 60 
                ? `${(totalWorkMins / 60).toFixed(1)}h` 
                : `${totalWorkMins}m`}
            </h4>
            <p className="text-[9px] text-slate-500">Total sessions complétées</p>
          </div>
        </div>

        {/* Metric 3: Session Completion Rate */}
        <div className="glass-card p-4 space-y-2 border border-black/5 dark:border-white/5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Taux de Réussite</span>
            <TrendingUp size={14} className="text-brand-cyan dark:text-brand-cyan-glow" />
          </div>
          <div>
            <h4 className="text-2xl font-bold font-sans text-slate-850 dark:text-white">{completionRate}%</h4>
            <p className="text-[9px] text-slate-500">Sessions non interrompues</p>
          </div>
        </div>

        {/* Metric 4: Total Sessions */}
        <div className="glass-card p-4 space-y-2 border border-black/5 dark:border-white/5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Sessions Commencées</span>
            <Activity size={14} className="text-amber-500" />
          </div>
          <div>
            <h4 className="text-2xl font-bold font-sans text-slate-850 dark:text-white">{workSessions.length}</h4>
            <p className="text-[9px] text-slate-500">Au total sur l'appareil</p>
          </div>
        </div>
      </div>

      {/* 📈 Graph Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Graph 1: Line chart (Focus Evolution) */}
        <div className="lg:col-span-3 glass-panel rounded-2xl p-5 space-y-4 border border-black/5 dark:border-white/5">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ÉVOLUTION DE LA CONCENTRATION</span>
            <span className="text-[10px] text-slate-500 font-mono">7 dernières sessions</span>
          </div>
          <div className="h-64 relative">
            {recentWorkSessions.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs italic">
                Enregistrez des sessions pour tracer l'évolution.
              </div>
            ) : (
              <Line data={lineChartData} options={lineChartOptions} />
            )}
          </div>
        </div>

        {/* Graph 2: Bar chart (Focus Distribution) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 space-y-4 border border-black/5 dark:border-white/5">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">RÉPARTITION DU TEMPS</span>
            <span className="text-[10px] text-slate-500 font-mono">Dernières 5 sessions</span>
          </div>
          <div className="h-64 relative">
            {totalWorkMins === 0 && focusLogs.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs italic">
                Enregistrez du travail pour répartir les états.
              </div>
            ) : (
              <Bar data={barChartData} options={barChartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* 📅 Historical Overview List */}
      <div className="glass-panel rounded-2xl p-5 space-y-4 border border-black/5 dark:border-white/5">
        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">TENDANCES & RESUMÉ DU TRAVAIL</span>
          <Calendar size={14} className="text-slate-500" />
        </div>

        {sessions.length === 0 ? (
          <p className="text-xs text-slate-500 italic">Aucune historique disponible pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 10).map(session => {
              const date = new Date(session.startTime).toLocaleDateString([], { day: 'numeric', month: 'short' });
              const time = new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-slate-950/20 border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${session.type === 'work' ? 'bg-brand-purple' : 'bg-emerald-500'}`} />
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-800 dark:text-white">
                        {session.type === 'work' ? '💻 Session de Concentration' : '☕ Session de Pause'}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <span>{date} à {time}</span>
                        {session.cameraUsed && <span className="text-[8px] bg-brand-cyan/20 text-brand-cyan px-1 rounded">cam</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-[11px] text-slate-650 dark:text-slate-400">
                    <div className="text-right">
                      <span className="font-semibold block">{Math.round(session.durationSeconds / 60)} min</span>
                      <span className="text-[9px] text-slate-500">durée</span>
                    </div>
                    {session.type === 'work' && (
                      <div className="text-right">
                        <span className="font-semibold block text-brand-purple dark:text-brand-purple-glow">{session.focusScore}%</span>
                        <span className="text-[9px] text-slate-500">focus</span>
                      </div>
                    )}
                    <div className="text-right flex items-center gap-3">
                      <div>
                        {session.interrupted ? (
                          <span className="text-rose-500 dark:text-rose-400 font-medium">Interrompu</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Complété</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteSession(session.id!)}
                        className="p-1 rounded hover:bg-red-500/10 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title="Supprimer la session"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🛠️ MANUAL SESSION MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
          <div className="w-full max-w-md glass-card p-6 md:p-8 space-y-5 border border-white/10 shadow-2xl relative">
            
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-sans text-slate-850 dark:text-white">Saisir une session manuelle</h3>
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveManualSession} className="space-y-4">
              
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</label>
                  <input 
                    type="date" 
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="glass-input w-full text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Heure de début</label>
                  <input 
                    type="time" 
                    required
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="glass-input w-full text-xs"
                  />
                </div>
              </div>

              {/* Duration & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Durée (minutes)</label>
                  <input 
                    type="number" 
                    min="1"
                    max="180"
                    required
                    value={manualDuration}
                    onChange={(e) => setManualDuration(parseInt(e.target.value, 10))}
                    className="glass-input w-full text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Type de session</label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value as any)}
                    className="glass-input w-full text-xs cursor-pointer focus:ring-0"
                  >
                    <option value="work">Concentration</option>
                    <option value="break">Pause</option>
                  </select>
                </div>
              </div>

              {/* Focus Score (only for work sessions) */}
              {manualType === 'work' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                    <span>Score de concentration estimé</span>
                    <span className="text-brand-purple dark:text-brand-purple-glow font-bold">{manualScore}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={manualScore} 
                    onChange={(e) => setManualScore(parseInt(e.target.value, 10))}
                    className="w-full"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 border border-black/5 dark:border-white/5 bg-black/5 dark:bg-slate-900/40 rounded-xl text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-brand-blue to-brand-purple text-white text-xs font-bold rounded-xl shadow-lg hover:opacity-95 transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Analytics;
