import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import { Session, FocusLog } from '../../main/db';
import { classifyWebcamFocus } from '../utils/faceDetection';
import { speak } from '../utils/speech';

export type TimerMode = 'work' | 'break';
export type FocusStatus = 'focused' | 'distracted' | 'absent';

interface TimerContextType {
  timeLeft: number;
  duration: number;
  isActive: boolean;
  mode: TimerMode;
  focusStatus: FocusStatus;
  focusScore: number;
  currentSessionId: string | null;
  workDuration: number;
  breakDuration: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipSession: () => void;
  setFocusStatus: (status: FocusStatus) => void;
  adaptiveAdvice: string;
  cameraStream: MediaStream | null;
  setCustomDuration: (minutes: number) => void;
  announceRemainingTime: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useApp();
  
  // Custom states that can adjust dynamically
  const [workDuration, setWorkDuration] = useState(settings.workDuration * 60);
  const [breakDuration, setBreakDuration] = useState(settings.breakDuration * 60);
  
  const [mode, setMode] = useState<TimerMode>('work');
  const [duration, setDuration] = useState(settings.workDuration * 60);
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  
  const [focusStatus, setFocusStatus] = useState<FocusStatus>('focused');
  const [focusScore, setFocusScore] = useState(100);
  const [adaptiveAdvice, setAdaptiveAdvice] = useState('Prêt à commencer votre session de concentration ?');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const sessionIdRef = useRef<string | null>(null);
  const focusSamplesRef = useRef<number[]>([]);
  const lastActiveTimeRef = useRef<number>(Date.now());
  const windowFocusedRef = useRef<boolean>(true);
  const keypressCountRef = useRef<number>(0);
  const mousemoveCountRef = useRef<number>(0);
  const lastFacePositionRef = useRef<{ x: number; y: number } | null>(null);
  const movementHistoryRef = useRef<{ distance: number; time: number }[]>([]);
  const lastSpokenStatusRef = useRef<string | null>(null);
  const statusHistoryRef = useRef<FocusStatus[]>([]);
  
  // Sync durations when user updates them in settings, unless a session is running
  useEffect(() => {
    if (!isActive) {
      const wSecs = settings.workDuration * 60;
      const bSecs = settings.breakDuration * 60;
      setWorkDuration(wSecs);
      setBreakDuration(bSecs);
      setDuration(mode === 'work' ? wSecs : bSecs);
      setTimeLeft(mode === 'work' ? wSecs : bSecs);
    }
  }, [settings.workDuration, settings.breakDuration, mode, isActive]);

  // Expose sessionId to renderer
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Annoncer vocalement le changement d'état du focus
  useEffect(() => {
    if (settings.enableSpeech && isActive && mode === 'work') {
      if (lastSpokenStatusRef.current !== focusStatus) {
        lastSpokenStatusRef.current = focusStatus;
        if (focusStatus === 'focused') {
          speak("Concentré");
        } else if (focusStatus === 'distracted') {
          speak("Attention, vous semblez distrait.");
        } else if (focusStatus === 'absent') {
          speak("Attention, aucun visage détecté.");
        }
      }
    }
  }, [focusStatus, settings.enableSpeech, isActive, mode]);

  // Monitor Window Focus changes from Electron Main
  useEffect(() => {
    const unsubscribe = window.electronAPI.activity.onWindowFocusChange((focused) => {
      windowFocusedRef.current = focused;
      if (!focused && isActive && mode === 'work') {
        // Log tab change penalty immediately
        keypressCountRef.current = 0; // reset
        if (sessionIdRef.current) {
          logFocusStatus('distracted', 'activity');
        }
      }
    });

    // Capture user inputs in window
    const handleKeyDown = () => {
      keypressCountRef.current += 1;
      lastActiveTimeRef.current = Date.now();
    };

    const handleMouseMove = () => {
      mousemoveCountRef.current += 1;
      lastActiveTimeRef.current = Date.now();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isActive, mode]);

  // Log focus status to Database
  const logFocusStatus = async (status: FocusStatus, source: 'webcam' | 'activity') => {
    if (!sessionIdRef.current) return;
    try {
      const log: FocusLog = {
        timestamp: new Date().toISOString(),
        sessionId: sessionIdRef.current,
        status,
        source
      };
      await window.electronAPI.db.saveFocusLog(log);
      
      // Map status to score points
      let points = 100;
      if (status === 'distracted') points = 40;
      if (status === 'absent') points = 0;
      
      focusSamplesRef.current.push(points);
      
      // Calculate running average
      const sum = focusSamplesRef.current.reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / focusSamplesRef.current.length);
      setFocusScore(avg);
    } catch (e) {
      console.error('Failed to log focus status:', e);
    }
  };

  // Camera-less focus evaluation logic
  const evaluateCameraLessFocus = async () => {
    try {
      const idleTime = await window.electronAPI.activity.getSystemIdleTime();
      let status: FocusStatus = 'focused';

      if (idleTime > 45) {
        // System is completely idle for more than 45s -> Absent
        status = 'absent';
      } else if (idleTime > 15) {
        // System idle for more than 15s -> Distracted
        status = 'distracted';
      } else {
        // Active inputs somewhere on the system -> Focused
        status = 'focused';
      }

      // Lissage par vote majoritaire
      statusHistoryRef.current.push(status);
      if (statusHistoryRef.current.length > 3) {
        statusHistoryRef.current.shift();
      }

      const counts = statusHistoryRef.current.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {} as Record<FocusStatus, number>);

      let smoothedStatus: FocusStatus = 'focused';
      if (counts['absent'] >= 2) {
        smoothedStatus = 'absent';
      } else if (counts['distracted'] >= 2) {
        smoothedStatus = 'distracted';
      }

      setFocusStatus(smoothedStatus);
      await logFocusStatus(smoothedStatus, 'activity');
    } catch (err) {
      console.error('Error in camera-less focus check:', err);
    }
  };

  // 🎥 GLOBAL BACKGROUND FOCUS TELEMETRY LOOP
  useEffect(() => {
    let stream: MediaStream | null = null;
    let video: HTMLVideoElement | null = null;
    let active = true;
    let loopTimeoutId: NodeJS.Timeout | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 200, height: 150, frameRate: { max: 15 } } 
        });
        setCameraStream(stream);

        // Create background video element (unmounted in DOM, runs in memory)
        video = document.createElement('video');
        video.width = 200;
        video.height = 150;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.srcObject = stream;
        
        video.onloadedmetadata = () => {
          if (video) video.play().catch(e => console.warn('Background play blocked:', e));
        };
      } catch (e) {
        console.warn('Failed to start global webcam stream:', e);
      }
    };

    const runTelemetryStep = async () => {
      if (!active) return;

      try {
        if (isActive && mode === 'work') {
          // Fetch system idle time to override face absences if the user is typing/clicking
          const idleTime = await window.electronAPI.activity.getSystemIdleTime();

          if (settings.enableAI && settings.enableWebcam) {
            // Lazy start camera stream if active
            if (!stream) {
              await startCamera();
            }

            if (video && video.readyState >= 2) {
              const result = await classifyWebcamFocus(video, 200, 150);
              let status = result.status;
              const faceBox = result.faceBox;

              // Détection des mouvements fréquents
              if (faceBox) {
                const normX = faceBox.x / 200;
                const normY = faceBox.y / 150;
                
                if (lastFacePositionRef.current) {
                  const dx = normX - lastFacePositionRef.current.x;
                  const dy = normY - lastFacePositionRef.current.y;
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  const now = Date.now();
                  
                  movementHistoryRef.current.push({ distance, time: now });
                  // Conserver l'historique sur 15 secondes
                  movementHistoryRef.current = movementHistoryRef.current.filter(m => now - m.time < 15000);
                  
                  const significantMovements = movementHistoryRef.current.filter(m => m.distance > 0.08);
                  if (significantMovements.length >= 4) {
                    status = 'distracted';
                  }
                }
                
                lastFacePositionRef.current = { x: normX, y: normY };
              }

              // Override: If the user is actively typing or clicking (idleTime < 8s), they are focused,
              // even if the camera thinks they are absent or distracted (e.g. looking at another screen or their keyboard).
              if ((status === 'absent' || status === 'distracted') && idleTime < 8) {
                status = 'focused';
              }

              // Lissage par vote majoritaire sur les 3 dernières classifications
              statusHistoryRef.current.push(status);
              if (statusHistoryRef.current.length > 3) {
                statusHistoryRef.current.shift();
              }

              const counts = statusHistoryRef.current.reduce((acc, val) => {
                acc[val] = (acc[val] || 0) + 1;
                return acc;
              }, {} as Record<FocusStatus, number>);

              let smoothedStatus: FocusStatus = 'focused';
              if (counts['absent'] >= 2) {
                smoothedStatus = 'absent';
              } else if (counts['distracted'] >= 2) {
                smoothedStatus = 'distracted';
              }

              setFocusStatus(smoothedStatus);
              await logFocusStatus(smoothedStatus, 'webcam');
            } else {
              // Video loading or camera failed -> Fall back to inputs activity tracker
              await evaluateCameraLessFocus();
            }
          } else {
            // Camera toggle turned off -> use inputs activity tracker
            await evaluateCameraLessFocus();
          }
        }
      } catch (err) {
        console.error('Telemetry loop step error:', err);
      }

      // Schedule next check (every 1.5 seconds) AFTER current evaluation completes.
      // This guarantees zero thread-blocking / page lagging.
      if (active) {
        loopTimeoutId = setTimeout(runTelemetryStep, 1500);
      }
    };

    if (isActive && mode === 'work') {
      runTelemetryStep();
    }

    return () => {
      active = false;
      if (loopTimeoutId) clearTimeout(loopTimeoutId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setCameraStream(null);
    };
  }, [isActive, mode, settings.enableAI, settings.enableWebcam]);

  // Core Timer Countdown Interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval!);
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  // Start current session
  const startTimer = async () => {
    if (!isActive) {
      setIsActive(true);
      // Create session entry if this is a brand new session start
      if (!sessionIdRef.current) {
        const id = 'sf_' + Date.now();
        sessionIdRef.current = id;
        setCurrentSessionId(id);
        focusSamplesRef.current = [100]; // init
        setFocusScore(100);
        
        // Show start notification
        if (settings.enableNotifications) {
          window.electronAPI.notifications.show(
            mode === 'work' ? 'StudyFlow - C\'est parti !' : 'StudyFlow - Pause !',
            mode === 'work' ? 'Restez concentré pendant cette session.' : 'Détendez-vous quelques instants.'
          );
        }
      }
      if (settings.enableSpeech) {
        speak(mode === 'work' ? "Session de travail lancée." : "Session de pause lancée.");
      }
    }
  };

  // Pause session
  const pauseTimer = () => {
    setIsActive(false);
    if (settings.enableSpeech) {
      speak("Minuteur suspendu.");
    }
  };

  // Reset timer
  const resetTimer = () => {
    setIsActive(false);
    sessionIdRef.current = null;
    setCurrentSessionId(null);
    focusSamplesRef.current = [];
    setFocusScore(100);
    setTimeLeft(duration);
    if (settings.enableSpeech) {
      speak("Minuteur réinitialisé.");
    }
  };

  // Skip current Pomodoro
  const skipSession = () => {
    setIsActive(false);
    saveSessionToDatabase(true); // save as interrupted
    switchMode();
    if (settings.enableSpeech) {
      speak("Session passée.");
    }
  };

  const switchMode = () => {
    const nextMode = mode === 'work' ? 'break' : 'work';
    const nextDuration = nextMode === 'work' ? workDuration : breakDuration;
    
    setMode(nextMode);
    setDuration(nextDuration);
    setTimeLeft(nextDuration);
    setIsActive(false);
    sessionIdRef.current = null;
    setCurrentSessionId(null);
    focusSamplesRef.current = [];
    setFocusScore(100);
  };

  const setCustomDuration = (minutes: number) => {
    if (isActive) return;
    const secs = minutes * 60;
    if (mode === 'work') {
      setWorkDuration(secs);
    } else {
      setBreakDuration(secs);
    }
    setDuration(secs);
    setTimeLeft(secs);
    if (settings.enableSpeech) {
      speak(`Durée réglée à ${minutes} minute${minutes > 1 ? 's' : ''}.`);
    }
  };

  // Handle Session completion
  const handleSessionEnd = async () => {
    setIsActive(false);
    await saveSessionToDatabase(false);
    
    // Process adaptive feedback only for Work sessions
    if (mode === 'work') {
      applyAdaptiveRules();
      if (settings.enableSpeech) {
        speak("Travail terminé. C'est l'heure de la pause.");
      }
    } else {
      setAdaptiveAdvice('Votre pause est terminée. Prêt à reprendre le travail ?');
      if (settings.enableNotifications) {
        window.electronAPI.notifications.show(
          'Pause terminée !',
          'Retournons au travail pour accomplir vos tâches.'
        );
      }
      if (settings.enableSpeech) {
        speak("Pause terminée. Retour au travail.");
      }
    }

    switchMode();
  };

  // Save session info
  const saveSessionToDatabase = async (interrupted = false) => {
    if (!sessionIdRef.current) return;
    try {
      const elapsed = duration - timeLeft;
      if (elapsed < 5) {
        // Don't save very short sessions (e.g. less than 5 seconds) to keep statistics clean
        return;
      }

      const session: Session = {
        startTime: new Date(Date.now() - elapsed * 1000).toISOString(),
        endTime: new Date().toISOString(),
        type: mode,
        durationSeconds: elapsed,
        focusScore: mode === 'work' ? focusScore : 100,
        cameraUsed: settings.enableWebcam && settings.enableAI,
        interrupted
      };

      await window.electronAPI.db.saveSession(session);
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

  // Periodic remaining time vocalization for visually impaired users
  useEffect(() => {
    if (settings.enableSpeech && isActive) {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      
      // Announce at specific milestones:
      // - Every 5 minutes (e.g. 20, 15, 10, 5)
      // - Every minute under 5 minutes (4, 3, 2, 1)
      // - At 30 seconds, 15 seconds, and 10 seconds
      if (secs === 0) {
        if (mins > 0 && (mins % 5 === 0 || mins < 5)) {
          speak(`Il reste ${mins} minute${mins > 1 ? 's' : ''}.`);
        }
      } else if (mins === 0) {
        if (secs === 30 || secs === 15 || secs === 10) {
          speak(`Il reste ${secs} secondes.`);
        }
      }
    }
  }, [timeLeft, isActive, settings.enableSpeech]);

  const announceRemainingTime = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    let text = "";
    if (mins > 0) {
      text = `Il reste ${mins} minute${mins > 1 ? 's' : ''} ${secs > 0 ? `et ${secs} seconde${secs > 1 ? 's' : ''}` : ''}.`;
    } else {
      text = `Il reste ${secs} seconde${secs > 1 ? 's' : ''}.`;
    }
    speak(text);
  };

  // Adaptive Rules implementation
  const applyAdaptiveRules = () => {
    const score = focusScore;
    const currentWMin = workDuration / 60;
    const currentBMin = breakDuration / 60;

    let nextWMin = currentWMin;
    let nextBMin = currentBMin;
    let advice = '';

    if (score >= 85) {
      // High Focus -> Increase work duration up to max
      nextWMin = Math.min(settings.maxPomodoro, currentWMin + 5);
      // Reset break duration to default 5 min if it was high
      nextBMin = Math.max(5, settings.breakDuration);
      advice = `Excellente concentration (${score}%) ! Votre temps de travail a été augmenté à ${nextWMin} min.`;
      
      if (settings.enableNotifications) {
        window.electronAPI.notifications.show(
          'Superbe concentration ! 🚀',
          `Travail augmenté à ${nextWMin} minutes pour la prochaine session.`
        );
      }
    } else if (score < 60) {
      // Low Focus / Highly Distracted -> Reduce work duration and increase break duration
      nextWMin = Math.max(settings.minPomodoro, currentWMin - 5);
      nextBMin = currentBMin + 2; // more rest
      advice = `Focus bas (${score}%) : durée de travail réduite à ${nextWMin} min et pause rallongée à ${nextBMin} min. Prenez l'air !`;
      
      if (settings.enableNotifications) {
        window.electronAPI.notifications.show(
          'Fatigue détectée ☕',
          `Session réduite à ${nextWMin}m. Pause rallongée à ${nextBMin}m.`
        );
      }
    } else {
      // Average Focus -> Retain or revert slowly to defaults
      const baseW = settings.workDuration;
      if (currentWMin > baseW) {
        nextWMin = currentWMin - 1; // slow decay to standard
      } else if (currentWMin < baseW) {
        nextWMin = currentWMin + 1;
      }
      nextBMin = settings.breakDuration;
      advice = `Bonne concentration (${score}%). Poursuivez sur cette lancée !`;
      
      if (settings.enableNotifications) {
        window.electronAPI.notifications.show(
          'Session terminée ! 🎉',
          `Prenez une pause de ${nextBMin} minutes.`
        );
      }
    }

    setWorkDuration(nextWMin * 60);
    setBreakDuration(nextBMin * 60);
    setAdaptiveAdvice(advice);
  };

  return (
    <TimerContext.Provider
      value={{
        timeLeft,
        duration,
        isActive,
        mode,
        focusStatus,
        focusScore,
        currentSessionId,
        workDuration,
        breakDuration,
        startTimer,
        pauseTimer,
        resetTimer,
        skipSession,
        setFocusStatus,
        adaptiveAdvice,
        cameraStream,
        setCustomDuration,
        announceRemainingTime
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
