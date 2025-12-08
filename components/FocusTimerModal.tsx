import React, { useState, useEffect } from 'react';
import { StudyTask } from '../types';
import { X, Play, Pause, RotateCcw, CheckCircle2, Coffee, Zap, Plus, Minus } from 'lucide-react';

interface FocusTimerModalProps {
  task: StudyTask;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  theme: any;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({ task, isOpen, onClose, onComplete, theme }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25m
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'FOCUS' | 'BREAK'>('FOCUS'); // Focus or Break
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Helper to parse duration strings like "45m", "1h", "1.5h"
  const parseDuration = (durationStr?: string): number => {
    if (!durationStr) return 25 * 60;
    
    const str = durationStr.toLowerCase().trim();
    try {
      if (str.includes('h')) {
        const hours = parseFloat(str.replace('h', ''));
        return Math.floor(hours * 60 * 60);
      }
      if (str.includes('m')) {
        const mins = parseFloat(str.replace('m', ''));
        return Math.floor(mins * 60);
      }
      // Simple number assumed to be minutes
      if (!isNaN(parseFloat(str))) {
          return Math.floor(parseFloat(str) * 60);
      }
    } catch (e) {
      console.error("Error parsing time", e);
    }
    return 25 * 60;
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Timer finished
      if (mode === 'FOCUS') {
        setSessionsCompleted(prev => prev + 1);
        setMode('BREAK');
        setTimeLeft(5 * 60); // 5m break
        setInitialTime(5 * 60);
      } else {
        setMode('FOCUS');
        // Reset to task duration
        const duration = parseDuration(task.customSessionDuration);
        setTimeLeft(duration);
        setInitialTime(duration);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, task.customSessionDuration]);

  useEffect(() => {
    // Reset when modal opens or task changes
    if (isOpen) {
      // Determine start time based on task settings or defaults
      let startSeconds = 25 * 60;
      
      // 1. Try custom session duration (e.g. "45m")
      if (task.customSessionDuration) {
        startSeconds = parseDuration(task.customSessionDuration);
      } 
      // 2. Or infer from difficulty (just for initial default)
      else if (task.difficulty === 'Rất khó' || task.difficulty === 'Khó') {
        startSeconds = 45 * 60;
      }

      setTimeLeft(startSeconds);
      setInitialTime(startSeconds);
      setIsActive(false);
      setMode('FOCUS');
    }
  }, [isOpen, task]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(initialTime);
  };

  const adjustTime = (minutes: number) => {
    if (isActive) return;
    const newTime = Math.max(60, timeLeft + (minutes * 60)); // Minimum 1 minute
    setTimeLeft(newTime);
    setInitialTime(newTime);
  };

  const progressPct = initialTime > 0 
    ? ((initialTime - timeLeft) / initialTime) * 100 
    : 0;

  // Calculate wave height (inverse of progress, since it drains or fills)
  const fillPercentage = mode === 'FOCUS' 
      ? (timeLeft / initialTime) * 100 
      : ((initialTime - timeLeft) / initialTime) * 100;

  // Colors
  const waveColor1 = mode === 'FOCUS' ? theme.palette[0] : '#34d399';
  const waveColor2 = mode === 'FOCUS' ? theme.palette[1] : '#10b981';
  const waveColor3 = mode === 'FOCUS' ? theme.palette[2] : '#059669';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-fade-in">
      {/* Inject Keyframes for Triple-Layer Wave Animation locally */}
      <style>{`
        @keyframes wave {
          0% { transform: translateX(0); }
          50% { transform: translateX(-25%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes wave-reverse {
          0% { transform: translateX(0); }
          50% { transform: translateX(25%); }
          100% { transform: translateX(50%); }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-wave-flow { animation: wave 4s linear infinite; }
        .animate-wave-flow-slow { animation: wave 7s linear infinite; }
        .animate-wave-flow-reverse { animation: wave-reverse 6s linear infinite; }
        .animate-bob { animation: bob 3s ease-in-out infinite; }
      `}</style>

      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden relative">
        
        {/* Background Ambient Glow */}
        <div className={`absolute top-0 left-0 w-full h-2 transition-all duration-1000 ${isActive ? 'w-full' : 'w-0'}`} style={{ backgroundColor: theme.palette[0] }}></div>
        
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 relative z-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-2xl">
                {task.icon}
             </div>
             <div className="overflow-hidden">
               <h3 className="font-bold text-slate-800 dark:text-white leading-tight truncate max-w-[200px]">{task.subject}</h3>
               <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Focus Room</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Timer Display */}
        <div className="p-8 flex flex-col items-center justify-center text-center relative">
           
           {/* Triple-Layer Liquid Wave Container */}
            <div className="relative w-72 h-72 flex items-center justify-center mb-8 overflow-hidden rounded-full border-4 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-inner">
              
              {/* SVG Wave Mask Container */}
              <div 
                className="absolute inset-0 w-full h-full flex flex-col justify-end transition-all duration-1000 ease-in-out animate-bob"
                style={{ 
                    // Move the wave group up/down based on fill percentage
                    transform: `translateY(${100 - fillPercentage}%)`
                }}
              >
                 <div className="relative w-[200%] h-full -left-1/2">
                    {/* Wave 3 (Deepest Back) */}
                    <svg className="absolute w-full h-32 -top-16 animate-wave-flow-reverse opacity-40" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M0,60 C300,120 600,20 1200,80 L1200,120 L0,120 Z" fill={waveColor3} />
                    </svg>

                    {/* Wave 1 (Middle) */}
                    <svg className="absolute w-full h-24 -top-12 animate-wave-flow-slow opacity-60" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M0,0 C300,100 600,0 1200,50 L1200,120 L0,120 Z" fill={waveColor2} />
                    </svg>

                    {/* Wave 2 (Front) */}
                    <svg className="absolute w-full h-24 -top-12 animate-wave-flow opacity-80" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M0,50 C300,0 600,100 1200,20 L1200,120 L0,120 Z" fill={waveColor1} />
                    </svg>

                    {/* Solid Fill Block below waves */}
                    <div className="w-full h-full" style={{ backgroundColor: waveColor1, opacity: 0.8 }}></div>
                 </div>
              </div>

              {/* Text Content Overlay */}
              <div className="flex flex-col items-center z-10 relative drop-shadow-md">
                 <div className={`text-6xl font-mono font-bold tracking-tighter mb-2 ${mode === 'FOCUS' ? (fillPercentage > 50 ? 'text-white' : 'text-slate-800 dark:text-slate-200') : 'text-emerald-600'}`}>
                    {formatTime(timeLeft)}
                 </div>
                 
                 <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 backdrop-blur-md shadow-sm border border-white/20 ${
                    mode === 'FOCUS' 
                    ? (fillPercentage > 50 ? 'bg-white/20 text-white' : 'bg-slate-100 text-indigo-600') 
                    : 'bg-emerald-100 text-emerald-700'
                 }`}>
                    {mode === 'FOCUS' ? <Zap className="w-3 h-3"/> : <Coffee className="w-3 h-3"/>}
                    {mode === 'FOCUS' ? 'Focus Mode' : 'Break Time'}
                 </div>

                 {/* Manual Time Controls (Only when paused) */}
                 {!isActive && (
                    <div className="flex items-center gap-3">
                        <button onClick={() => adjustTime(-5)} className="p-1 rounded-full bg-white/50 hover:bg-white text-slate-600 shadow-sm transition-all" title="-5 Minutes">
                            <Minus className="w-4 h-4"/>
                        </button>
                        <span className={`text-xs font-bold ${fillPercentage > 50 ? 'text-white/80' : 'text-slate-400'}`}>Điều chỉnh</span>
                        <button onClick={() => adjustTime(5)} className="p-1 rounded-full bg-white/50 hover:bg-white text-slate-600 shadow-sm transition-all" title="+5 Minutes">
                            <Plus className="w-4 h-4"/>
                        </button>
                    </div>
                 )}
              </div>
           </div>

           {/* Controls */}
           <div className="flex items-center gap-6 relative z-20">
              <button 
                onClick={resetTimer}
                className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="w-6 h-6" />
              </button>

              <button 
                onClick={toggleTimer}
                className="p-6 rounded-full text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all active:scale-95 flex items-center justify-center relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${theme.palette[0]}, ${theme.palette[1]})` }}
              >
                {isActive && <span className="absolute inset-0 bg-white/20 animate-pulse"></span>}
                {isActive ? <Pause className="w-8 h-8 fill-current relative z-10" /> : <Play className="w-8 h-8 fill-current ml-1 relative z-10" />}
              </button>
              
              <button 
                onClick={() => { onComplete(); onClose(); }}
                className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                title="Hoàn thành nhiệm vụ"
              >
                <CheckCircle2 className="w-6 h-6" />
              </button>
           </div>

           <p className="mt-8 text-sm text-slate-400 font-medium">
             {sessionsCompleted > 0 ? `Đã hoàn thành ${sessionsCompleted} phiên tập trung.` : 'Sẵn sàng chinh phục mục tiêu!'}
           </p>

        </div>
      </div>
    </div>
  );
};