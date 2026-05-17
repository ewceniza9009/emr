import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonIcon,
  IonToolbar,
  IonRippleEffect
} from '@ionic/react';
import {
  pulse,
  heart,
  walk,
  moon as moonIcon,
  sunny,
  checkmarkCircle,
  chevronForward,
  videocam,
  notifications,
  alertCircle
} from 'ionicons/icons';
import { useTheme } from '../contexts/ThemeContext';

const RecoveryDashboard: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [waitingRoomActive, setWaitingRoomActive] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Take morning medications', time: '08:00 AM', done: true },
    { id: 2, title: 'Record morning blood pressure', time: '09:00 AM', done: true },
    { id: 3, title: 'Complete PHQ-9 Assessment', time: '10:00 AM', done: true },
    { id: 4, title: 'Log evening wound photo', time: '06:00 PM', done: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const doneCount = tasks.filter(t => t.done).length;
  const percentage = Math.round((doneCount / tasks.length) * 100);

  // SVG Progress Ring Parameters
  const radius = 46;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <IonPage className="bg-slate-50 dark:bg-[#020408]">
      {/* Header - Extremely Compact Row */}
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ 
          '--min-height': '44px',
          '--padding-top': '4px',
          '--padding-bottom': '4px',
          '--padding-start': '16px',
          '--padding-end': '16px'
        }}>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="text-[9px] uppercase font-black tracking-widest text-emerald-600 dark:text-emerald-400">Connected</span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white font-sans flex items-baseline gap-1.5">
                Recovery <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Room 408</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 transition-colors"
                title={theme === 'dark' ? 'Switch to Porcelain Mode' : 'Switch to Midnight Mode'}
              >
                <IonIcon icon={theme === 'dark' ? sunny : moonIcon} className="w-4 h-4" />
              </button>

              {/* Notification Button */}
              <div className="relative p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300">
                <IonIcon icon={notifications} className="w-4 h-4" />
                <div className="absolute top-1 right-1 w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="space-y-5 pb-8">
          
          {/* Daily Care Ring - Glassmorphism */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b0f19] dark:bg-gradient-to-br dark:from-slate-900/80 dark:to-[#0b0f19]/80 p-4.5 shadow-[0_4px_20px_rgba(15,23,42,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
            <div className="absolute -right-16 -top-16 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold tracking-wider text-teal-600 dark:text-teal-400 uppercase">Today's Progress</span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Daily Care Ring</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  {doneCount === tasks.length 
                    ? '🎉 Excellent! All tasks completed!' 
                    : `${tasks.length - doneCount} task${tasks.length - doneCount > 1 ? 's' : ''} remaining.`}
                </p>
              </div>

              {/* Animated Progress Ring */}
              <div className="relative flex items-center justify-center flex-shrink-0">
                <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                  {/* Track */}
                  <circle
                    stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'}
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                  />
                  {/* Glowing Progress Indicator */}
                  <circle
                    stroke="url(#tealGradient)"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                  />
                  {/* Definitions for Gradient */}
                  <defs>
                    <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0d9488" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">{percentage}%</span>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="mt-4 space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`ion-activatable relative overflow-hidden flex items-center justify-between p-3 rounded-xl transition-all duration-300 border cursor-pointer ${
                    task.done
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <IonRippleEffect />
                  <div className="flex items-center gap-3">
                    <IonIcon
                      icon={checkmarkCircle}
                      className={`w-5 h-5 transition-colors duration-300 ${
                        task.done ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-650'
                      }`}
                    />
                    <div>
                      <p className={`text-xs font-semibold ${task.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                        {task.title}
                      </p>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">{task.time}</span>
                    </div>
                  </div>
                  <IonIcon icon={chevronForward} className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
                </div>
              ))}
            </div>
          </div>

          {/* Virtual Waiting Room Banner - Responsive colors */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#090d16] dark:bg-gradient-to-r dark:from-teal-950/20 dark:via-[#0a1824]/40 dark:to-slate-900/80 p-4.5 shadow-[0_4px_20px_rgba(15,23,42,0.03)] dark:shadow-lg">
            <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-teal-500/5 to-transparent pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="p-3 bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl flex-shrink-0 animate-pulse">
                <IonIcon icon={videocam} className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-3 flex-grow">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Telehealth Video Triage</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Dr. Ross is reviewing your clinical logs. Connect for your virtual room check-in.
                  </p>
                </div>
                
                {waitingRoomActive ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                      <div className="w-1.5 h-1.5 bg-teal-500 dark:bg-teal-400 rounded-full animate-ping" />
                      <span>Doctor will connect shortly...</span>
                    </div>
                    <button
                      onClick={() => setWaitingRoomActive(false)}
                      className="w-full h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300/50 dark:active:bg-slate-650 text-slate-700 dark:text-slate-200 rounded-full text-xs font-bold transition-all border border-slate-200 dark:border-slate-700/50"
                      style={{ borderRadius: '9999px' }}
                    >
                      Leave Waiting Room
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setWaitingRoomActive(true)}
                    className="w-full h-10 flex items-center justify-center bg-teal-600 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-500 hover:bg-teal-500 dark:hover:from-teal-400 dark:hover:to-emerald-400 text-white dark:text-slate-950 rounded-full text-xs font-black tracking-wide uppercase transition-all shadow-[0_4px_12px_rgba(13,148,136,0.15)] dark:shadow-[0_4px_12px_rgba(20,184,166,0.3)]"
                    style={{ borderRadius: '9999px' }}
                  >
                    Join Virtual Waiting Room
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Wearables / IoT Telemetry Grid */}
          <div>
            <h3 className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-black mb-2.5 px-1">Wearables Telemetry</h3>
            <div className="grid grid-cols-2 gap-3">
              
              {/* Heart Rate Card */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
                <div className="absolute top-3.5 right-3.5 text-rose-500 animate-pulse">
                  <IonIcon icon={heart} className="w-5 h-5" />
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Heart Rate</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white">72</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">BPM</span>
                </div>
                <div className="mt-3.5 flex items-center gap-1.5 text-[9px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-950/40 px-2 py-0.5 rounded-full w-max">
                  <IonIcon icon={pulse} className="w-3 h-3" />
                  <span>Resting 65</span>
                </div>
              </div>

              {/* Active Steps Card */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
                <div className="absolute top-3.5 right-3.5 text-teal-600 dark:text-teal-400">
                  <IonIcon icon={walk} className="w-5 h-5" />
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Steps Today</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white">6,420</span>
                </div>
                {/* Step Goal Progress */}
                <div className="mt-3.5 space-y-1">
                  <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 dark:bg-teal-500 rounded-full" style={{ width: '80%' }} />
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-400 dark:text-slate-500 font-mono">
                    <span>80%</span>
                    <span>8,000 target</span>
                  </div>
                </div>
              </div>

              {/* Sleep Analysis Card */}
              <div className="col-span-2 relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
                <div className="absolute top-4 right-4 text-violet-600 dark:text-violet-400">
                  <IonIcon icon={moonIcon} className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Sleep Quality</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-slate-900 dark:text-white">7h 45m</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Optimal</span>
                    </div>
                  </div>
                  <div className="flex-grow flex gap-2 justify-end text-right">
                    <div>
                      <span className="block text-[8px] uppercase text-slate-400 dark:text-slate-500">Deep</span>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono">2h 15m</span>
                    </div>
                    <div className="border-l border-slate-100 dark:border-slate-800 pl-2">
                      <span className="block text-[8px] uppercase text-slate-400 dark:text-slate-500">REM</span>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono">1h 50m</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* HIPAA Advisory Footer */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-900/60">
            <IonIcon icon={alertCircle} className="w-4 h-4 text-slate-400 dark:text-slate-650 mt-0.5 flex-shrink-0" />
            <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-snug">
              This room is a HIPAA-compliant virtual clinical workspace. All communications, video triage, and wearable telemetry are encrypted in transit and at rest.
            </span>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default RecoveryDashboard;
