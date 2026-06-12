import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Cpu, 
  Settings2, 
  BookOpen, 
  CheckCircle2, 
  CameraOff, 
  ArrowRight, 
  ArrowLeft, 
  Sun, 
  Moon,
  Laptop
} from 'lucide-react';

const Onboarding: React.FC = () => {
  const { updateSetting, setCurrentTab, settings } = useApp();
  const [step, setStep] = useState(1);
  
  // Preferences states
  const [workDur, setWorkDur] = useState(25);
  const [breakDur, setBreakDur] = useState(5);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>('system');

  // Camera check states
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Calibration states
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);

  // Apply visual theme changes during onboarding
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (t: 'dark' | 'light') => {
      if (t === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };

    if (themeMode === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(media.matches ? 'dark' : 'light');
    } else {
      applyTheme(themeMode);
    }
  }, [themeMode]);

  // Clean up stream on unmount or step change
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Request camera on Step 2 & 3
  useEffect(() => {
    if ((step === 2 || step === 3) && webcamEnabled) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [step, webcamEnabled]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, frameRate: { max: 15 } } 
      });
      setStream(mediaStream);
      setHasCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (e) {
      console.warn('Camera access denied or unavailable:', e);
      setHasCamera(false);
      setWebcamEnabled(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Calibration simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 3 && calibrating) {
      interval = setInterval(() => {
        setCalibrationProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setCalibrating(false);
            return 100;
          }
          return prev + 5;
        });
      }, 150);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, calibrating]);

  const handleNext = () => {
    if (step === 5) {
      completeOnboarding();
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const startCalibration = () => {
    setCalibrationProgress(0);
    setCalibrating(true);
  };

  const toggleTheme = () => {
    if (themeMode === 'system') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('light');
    } else {
      setThemeMode('system');
    }
  };

  const completeOnboarding = async () => {
    // Save settings
    await updateSetting('workDuration', workDur);
    await updateSetting('breakDuration', breakDur);
    await updateSetting('enableAI', aiEnabled);
    await updateSetting('enableWebcam', webcamEnabled && (hasCamera === true));
    await updateSetting('theme', themeMode);
    await updateSetting('onboarded', true);
    
    // Redirect to main panel
    setCurrentTab('dashboard');
  };

  const stepVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { duration: 0.3 } },
    exit: { x: -50, opacity: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-6 relative ${themeMode === 'light' ? 'bg-brand-bgLight text-slate-800' : 'bg-brand-bgDark text-slate-100'}`}>
      
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-purple/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-cyan/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glassmorphism Wizard Card */}
      <div className="w-full max-w-xl glass-card relative p-8 md:p-10 flex flex-col min-h-[500px] justify-between shadow-2xl overflow-hidden">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800/40">
          <div 
            className="h-full bg-gradient-to-r from-brand-blue via-brand-purple to-brand-cyan transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Content Sliders */}
        <div className="my-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-6"
            >
              
              {/* STEP 1: Presentation */}
              {step === 1 && (
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-blue to-brand-purple text-white shadow-xl shadow-brand-purple/20 animate-float">
                    <Cpu size={32} />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-blue via-brand-purple to-brand-cyan font-sans">
                      Bienvenue sur StudyFlow
                    </h1>
                    <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      L'assistant de concentration intelligent qui adapte vos sessions de travail Pomodoro en temps réel à l'aide de l'intelligence artificielle locale.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto pt-4 text-left">
                    <div className="p-4 rounded-xl border border-white/5 bg-slate-950/20 space-y-1">
                      <h4 className="text-xs font-semibold text-brand-cyan-glow">🧠 IA Adaptative</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">Ajuste le temps selon votre focus (15-50m).</p>
                    </div>
                    <div className="p-4 rounded-xl border border-white/5 bg-slate-950/20 space-y-1">
                      <h4 className="text-xs font-semibold text-brand-purple-glow">🔒 100% Local</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">Respect strict de la vie privée. Aucun cloud.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Camera Check */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-brand-cyan/10 text-brand-cyan">
                      <Camera size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-sans">Vérification de la Webcam</h2>
                      <p className="text-xs text-slate-400">StudyFlow utilise votre caméra pour analyser vos mouvements oculaires et détecter vos distractions.</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-slate-950/40 rounded-2xl border border-white/5 aspect-video overflow-hidden relative">
                    {webcamEnabled && hasCamera !== false ? (
                      <video 
                        ref={videoRef}
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-6 text-center">
                        <CameraOff size={40} className="text-slate-600" />
                        <span className="text-sm font-medium text-slate-400">Caméra désactivée ou introuvable</span>
                        <span className="text-xs text-slate-500 max-w-xs leading-normal">Le mode sans caméra est disponible. L'activité de votre clavier et de votre souris sera utilisée pour évaluer votre focus.</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/20 border border-white/5">
                    <span className="text-xs text-slate-400">Activer le suivi par webcam</span>
                    <button
                      onClick={() => setWebcamEnabled(!webcamEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${webcamEnabled ? 'bg-brand-cyan' : 'bg-slate-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${webcamEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Calibration */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-brand-purple/10 text-brand-purple">
                      <Cpu size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-sans">Calibration de l'IA</h2>
                      <p className="text-xs text-slate-400">Chargeons les modules de détection faciale de TensorFlow.js pour configurer votre focus neutre.</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-slate-950/40 rounded-2xl border border-white/5 aspect-video overflow-hidden relative">
                    {webcamEnabled && hasCamera ? (
                      <div className="w-full h-full relative">
                        <video 
                          ref={videoRef}
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                        {/* Custom Calibration guide ring */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className={`w-32 h-44 rounded-full border-2 border-dashed ${calibrating ? 'border-brand-purple animate-pulse' : 'border-brand-cyan'} bg-brand-cyan/5`} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-400">
                        <Cpu size={32} className="text-brand-purple-glow animate-pulse" />
                        <span className="text-sm font-medium">Suivi par activité activé</span>
                        <span className="text-xs text-slate-500 max-w-xs">Aucune calibration faciale nécessaire en mode sans caméra.</span>
                      </div>
                    )}
                  </div>

                  {webcamEnabled && hasCamera && (
                    <div className="space-y-3">
                      <button
                        onClick={startCalibration}
                        disabled={calibrating}
                        className={`w-full py-2.5 rounded-xl font-semibold text-xs text-white transition-all ${
                          calibrating 
                            ? 'bg-slate-800 border border-slate-700 cursor-not-allowed' 
                            : 'bg-brand-purple hover:bg-brand-purple-hover shadow-lg shadow-brand-purple/15'
                        }`}
                      >
                        {calibrating ? `Calibration en cours : ${calibrationProgress}%` : 'Démarrer la Calibration'}
                      </button>

                      {calibrationProgress === 100 && (
                        <div className="flex items-center gap-2 text-xs text-emerald-400 justify-center">
                          <CheckCircle2 size={14} />
                          <span>Calibration réussie ! Modèle IA local configuré.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Preferences */}
              {step === 4 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-brand-cyan/10 text-brand-cyan">
                      <Settings2 size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-sans">Vos Préférences</h2>
                      <p className="text-xs text-slate-400">Configurez vos paramètres initiaux (modifiables à tout moment).</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Durations */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400">Durée de travail ({workDur} min)</label>
                        <input 
                          type="range" 
                          min="15" 
                          max="50" 
                          value={workDur} 
                          onChange={(e) => setWorkDur(parseInt(e.target.value, 10))}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400">Durée des pauses ({breakDur} min)</label>
                        <input 
                          type="range" 
                          min="3" 
                          max="15" 
                          value={breakDur} 
                          onChange={(e) => setBreakDur(parseInt(e.target.value, 10))}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* AI Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/20 border border-white/5">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold">Adaptation IA Dynamique</span>
                        <p className="text-[10px] text-slate-500 leading-none">Ajuste le timer selon votre fatigue ou concentration.</p>
                      </div>
                      <button
                        onClick={() => setAiEnabled(!aiEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${aiEnabled ? 'bg-brand-purple' : 'bg-slate-700'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {/* Theme Choice */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/20 border border-white/5">
                      <span className="text-xs font-semibold font-sans">Thème de l'interface</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setThemeMode('system')}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                            themeMode === 'system'
                              ? 'bg-brand-cyan/20 border-brand-cyan/40 text-brand-cyan-glow shadow-sm'
                              : 'border-white/5 bg-slate-900/40 text-slate-400'
                          }`}
                        >
                          <Laptop size={11} />
                          <span>OS</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setThemeMode('dark')}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                            themeMode === 'dark'
                              ? 'bg-brand-purple/20 border-brand-purple/40 text-brand-purple-glow shadow-sm'
                              : 'border-white/5 bg-slate-900/40 text-slate-400'
                          }`}
                        >
                          <Moon size={11} />
                          <span>Sombre</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setThemeMode('light')}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                            themeMode === 'light'
                              ? 'bg-brand-blue/20 border-brand-blue/40 text-brand-blue-glow shadow-sm'
                              : 'border-white/5 bg-slate-900/40 text-slate-400'
                          }`}
                        >
                          <Sun size={11} />
                          <span>Clair</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Tutorial & Shortcuts */}
              {step === 5 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-sans">Raccourcis Clavier Rapides</h2>
                      <p className="text-xs text-slate-400">Gagnez du temps et contrôlez l'interface sans souris.</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/20 border border-white/5">
                      <span className="text-xs text-slate-400">Lancer / Mettre en pause le timer</span>
                      <kbd className="text-xs font-mono px-2 py-0.5 bg-slate-900 border border-white/10 rounded-md">Espace</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/20 border border-white/5">
                      <span className="text-xs text-slate-400">Ouvrir le Dashboard</span>
                      <kbd className="text-xs font-mono px-2 py-0.5 bg-slate-900 border border-white/10 rounded-md">Ctrl + Shift + D</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/20 border border-white/5">
                      <span className="text-xs text-slate-400">Ouvrir les Tâches</span>
                      <kbd className="text-xs font-mono px-2 py-0.5 bg-slate-900 border border-white/10 rounded-md">Ctrl + Shift + T</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/20 border border-white/5">
                      <span className="text-xs text-slate-400">Ouvrir les Analytiques</span>
                      <kbd className="text-xs font-mono px-2 py-0.5 bg-slate-900 border border-white/10 rounded-md">Ctrl + Shift + A</kbd>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Buttons / Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border border-white/5 bg-slate-950/20 transition-all ${
              step === 1 
                ? 'opacity-30 cursor-not-allowed' 
                : 'hover:bg-slate-900 hover:text-slate-100'
            }`}
          >
            <ArrowLeft size={14} />
            <span>Précédent</span>
          </button>

          <button
            onClick={handleNext}
            disabled={step === 3 && webcamEnabled && hasCamera && !calibrating && calibrationProgress < 100}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all ${
              step === 3 && webcamEnabled && hasCamera && !calibrating && calibrationProgress < 100
                ? 'bg-slate-800 border border-slate-700 cursor-not-allowed text-slate-500'
                : 'bg-gradient-to-r from-brand-blue to-brand-purple hover:opacity-90 shadow-lg shadow-brand-purple/10'
            }`}
          >
            <span>{step === 5 ? 'Terminer' : 'Suivant'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
