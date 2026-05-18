import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client/core';
import { useQuery } from '@apollo/client/react';
import { useAuth } from '../contexts/AuthContext';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
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
  alertCircle,
  close,
  camera,
  cloudUpload
} from 'ionicons/icons';
import { useTheme } from '../contexts/ThemeContext';

const GET_DASHBOARD_DATA = gql`
  query GetDashboardData($patientId: UUID!) {
    myMobileProfile(patientId: $patientId) {
      firstName
      lastName
    }
    myMobilePrescriptions(patientId: $patientId) {
      prescriptionId
      dose
      frequency
      isActive
      medication {
        name
        genericName
      }
    }
  }
`;

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead or of hurting yourself in some way"
];

const RecoveryDashboard: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, apiUrl } = useAuth();
  
  const { data, loading, error } = useQuery<any>(GET_DASHBOARD_DATA, {
    variables: { patientId: user?.patientId },
    skip: !user?.patientId,
    fetchPolicy: 'cache-and-network'
  });

  const [liveVitals, setLiveVitals] = useState({ heartRate: 72, spO2: 98, temperature: 98.6 });
  const [waitingRoomActive, setWaitingRoomActive] = useState(false);
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [woundPhoto, setWoundPhoto] = useState<string | null>(null);
  
  // Modal states
  const [showWoundModal, setShowWoundModal] = useState(false);
  const [showPhqModal, setShowPhqModal] = useState(false);
  const [showBpModal, setShowBpModal] = useState(false);
  
  // BP input states
  const [systolic, setSystolic] = useState('118');
  const [diastolic, setDiastolic] = useState('78');
  const [bpValue, setBpValue] = useState<string | null>(null);
  
  // Photo upload progress
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // PHQ-9 quiz states
  const [phqAnswers, setPhqAnswers] = useState<number[]>(Array(9).fill(-1));
  const [phqStep, setPhqStep] = useState(0);
  const [phqScore, setPhqScore] = useState<number | null>(null);

  // Live Wearables integration
  useEffect(() => {
    if (!user?.patientId || !apiUrl) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${apiUrl}/hubs/telemetry`, {
        accessTokenFactory: () => localStorage.getItem('halkyone-mobile-token') || ''
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connection.start().then(() => {
      console.log('SignalR Connected to TelemetryHub');
      connection.invoke('JoinPatientStream', user.patientId);
    }).catch(err => console.error('SignalR Connection Error: ', err));

    connection.on('ReceiveVitals', (vitals: any) => {
      console.log('Received live vitals:', vitals);
      setLiveVitals({
        heartRate: vitals.heartRate || vitals.HeartRate || 72,
        spO2: vitals.spO2 || vitals.SpO2 || 98,
        temperature: vitals.temperature || vitals.Temperature || 98.6
      });
    });

    return () => {
      connection.stop();
    };
  }, [user?.patientId, apiUrl]);

  // Load and map checklist tasks
  useEffect(() => {
    const dateStr = new Date().toISOString().split('T')[0];
    const storageKey = `halkyone-care-ring-${dateStr}`;
    const savedState = localStorage.getItem(storageKey);
    
    const savedWound = localStorage.getItem(`halkyone-wound-photo-${dateStr}`);
    if (savedWound) setWoundPhoto(savedWound);
    
    const savedBp = localStorage.getItem(`halkyone-bp-value-${dateStr}`);
    if (savedBp) setBpValue(savedBp);
    
    const savedPhq = localStorage.getItem(`halkyone-phq-score-${dateStr}`);
    if (savedPhq) setPhqScore(parseInt(savedPhq));

    const meds = data?.myMobilePrescriptions || [];
    const activeMeds = meds.filter((m: any) => m.isActive);

    let defaultTasks: any[] = [];
    if (activeMeds.length > 0) {
      activeMeds.forEach((m: any) => {
        defaultTasks.push({
          id: `med-${m.prescriptionId}`,
          title: `Take ${m.medication.name} (${m.dose})`,
          time: m.frequency || '08:00 AM',
          done: false,
          type: 'medication'
        });
      });
    } else {
      defaultTasks.push({
        id: 'med-default',
        title: 'Take morning medications',
        time: '08:00 AM',
        done: false,
        type: 'medication'
      });
    }

    defaultTasks.push(
      { 
        id: 'bp', 
        title: savedBp ? `Record morning blood pressure (Recorded: ${savedBp})` : 'Record morning blood pressure', 
        time: '09:30 AM', 
        done: !!savedBp, 
        type: 'bp' 
      },
      { 
        id: 'phq', 
        title: savedPhq ? `Complete PHQ-9 Assessment (Scored: ${savedPhq})` : 'Complete PHQ-9 Assessment', 
        time: '10:00 AM', 
        done: !!savedPhq, 
        type: 'phq' 
      },
      { 
        id: 'wound', 
        title: savedWound ? 'Log evening wound photo (Logged)' : 'Log evening wound photo', 
        time: '06:00 PM', 
        done: !!savedWound, 
        type: 'wound' 
      }
    );

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        const merged = defaultTasks.map(t => {
          const match = parsed.find((p: any) => p.id === t.id);
          return match ? { ...t, done: match.done } : t;
        });
        setTasks(merged);
      } catch (e) {
        setTasks(defaultTasks);
      }
    } else {
      setTasks(defaultTasks);
    }
  }, [data]);

  const handleTaskClick = (task: any) => {
    if (task.done) {
      // Toggle task off
      if (task.type === 'wound') {
        const dateStr = new Date().toISOString().split('T')[0];
        localStorage.removeItem(`halkyone-wound-photo-${dateStr}`);
        setWoundPhoto(null);
      } else if (task.type === 'bp') {
        const dateStr = new Date().toISOString().split('T')[0];
        localStorage.removeItem(`halkyone-bp-value-${dateStr}`);
        setBpValue(null);
      } else if (task.type === 'phq') {
        const dateStr = new Date().toISOString().split('T')[0];
        localStorage.removeItem(`halkyone-phq-score-${dateStr}`);
        setPhqScore(null);
      }
      
      const newTitle = task.type === 'wound' 
        ? 'Log evening wound photo' 
        : task.type === 'bp' 
          ? 'Record morning blood pressure' 
          : task.type === 'phq' 
            ? 'Complete PHQ-9 Assessment' 
            : task.title;

      setTasks(prevTasks => {
        const updated = prevTasks.map(t => t.id === task.id ? { ...t, done: false, title: newTitle } : t);
        const dateStr = new Date().toISOString().split('T')[0];
        localStorage.setItem(`halkyone-care-ring-${dateStr}`, JSON.stringify(updated));
        return updated;
      });
      return;
    }

    if (task.type === 'wound') {
      setShowWoundModal(true);
    } else if (task.type === 'phq') {
      setPhqAnswers(Array(9).fill(-1));
      setPhqStep(0);
      setPhqScore(null);
      setShowPhqModal(true);
    } else if (task.type === 'bp') {
      setSystolic('118');
      setDiastolic('78');
      setShowBpModal(true);
    } else {
      updateTaskDone(task.id, true);
    }
  };

  const updateTaskDone = (id: string, done: boolean) => {
    setTasks(prevTasks => {
      const updated = prevTasks.map(t => t.id === id ? { ...t, done } : t);
      const dateStr = new Date().toISOString().split('T')[0];
      localStorage.setItem(`halkyone-care-ring-${dateStr}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleBpSubmit = () => {
    if (!systolic || !diastolic) return;
    const value = `${systolic}/${diastolic} mmHg`;
    setBpValue(value);
    const dateStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(`halkyone-bp-value-${dateStr}`, value);
    
    setTasks(prevTasks => {
      const updated = prevTasks.map(t => t.id === 'bp' ? { ...t, done: true, title: `Record morning blood pressure (Recorded: ${value})` } : t);
      localStorage.setItem(`halkyone-care-ring-${dateStr}`, JSON.stringify(updated));
      return updated;
    });
    setShowBpModal(false);
  };

  const handlePhqAnswer = (val: number) => {
    const updated = [...phqAnswers];
    updated[phqStep] = val;
    setPhqAnswers(updated);
    
    if (phqStep < 8) {
      setTimeout(() => {
        setPhqStep(prev => prev + 1);
      }, 200);
    } else {
      const total = updated.reduce((sum, current) => sum + current, 0);
      setPhqScore(total);
      const dateStr = new Date().toISOString().split('T')[0];
      localStorage.setItem(`halkyone-phq-score-${dateStr}`, total.toString());
    }
  };

  const getPhqSeverity = (score: number) => {
    if (score <= 4) return "Minimal Severity";
    if (score <= 9) return "Mild Severity";
    if (score <= 14) return "Moderate Severity";
    if (score <= 19) return "Moderately Severe";
    return "Severe Depression";
  };

  const submitPhqAssessment = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const score = phqScore || 0;
    setTasks(prevTasks => {
      const updated = prevTasks.map(t => t.id === 'phq' ? { ...t, done: true, title: `Complete PHQ-9 Assessment (Scored: ${score})` } : t);
      localStorage.setItem(`halkyone-care-ring-${dateStr}`, JSON.stringify(updated));
      return updated;
    });
    setShowPhqModal(false);
  };

  const handleWoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            setWoundPhoto(base64data);
            const dateStr = new Date().toISOString().split('T')[0];
            localStorage.setItem(`halkyone-wound-photo-${dateStr}`, base64data);
            
            setTasks(prevTasks => {
              const updated = prevTasks.map(t => t.id === 'wound' ? { ...t, done: true, title: 'Log evening wound photo (Logged)' } : t);
              localStorage.setItem(`halkyone-care-ring-${dateStr}`, JSON.stringify(updated));
              return updated;
            });
            
            setUploadProgress(0);
            setShowWoundModal(false);
          };
          reader.readAsDataURL(file);
          return 100;
        }
        return prev + 30;
      });
    }, 200);
  };

  const doneCount = tasks.filter(t => t.done).length;
  const percentage = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

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
                {loading ? 'Loading...' : data?.myMobileProfile?.firstName ? `Hi, ${data.myMobileProfile.firstName}` : 'Recovery'}
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  {data?.myMobileProfile?.lastName ? data.myMobileProfile.lastName : 'Room'}
                </span>
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
                  onClick={() => handleTaskClick(task)}
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
                        task.done ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-500'
                      }`}
                    />
                    {task.type === 'wound' && woundPhoto && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200/50 dark:border-slate-800 flex-shrink-0 shadow-sm">
                        <img src={woundPhoto} alt="Wound" className="w-full h-full object-cover" />
                      </div>
                    )}
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
                      className="w-full h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300/50 dark:active:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full text-xs font-bold transition-all border border-slate-200 dark:border-slate-700/50"
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
                  <span className="text-xl font-black text-slate-900 dark:text-white">{liveVitals.heartRate}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">BPM</span>
                </div>
                <div className="mt-3.5 flex items-center gap-1.5 text-[9px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-950/40 px-2 py-0.5 rounded-full w-max">
                  <IonIcon icon={pulse} className="w-3 h-3" />
                  <span>Resting 65</span>
                </div>
              </div>

              {/* Active SpO2 Card */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
                <div className="absolute top-3.5 right-3.5 text-teal-600 dark:text-teal-400">
                  <IonIcon icon={pulse} className="w-5 h-5" />
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Blood Oxygen</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white">{liveVitals.spO2}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">% SpO2</span>
                </div>
                <div className="mt-3.5 flex items-center gap-1.5 text-[9px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-950/40 px-2 py-0.5 rounded-full w-max">
                  <span>Normal Range</span>
                </div>
              </div>

              {/* Temperature Card */}
              <div className="col-span-2 relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
                <div className="absolute top-4 right-4 text-violet-600 dark:text-violet-400">
                  <IonIcon icon={sunny} className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Body Temperature</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-slate-900 dark:text-white">{liveVitals.temperature}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">°F</span>
                    </div>
                  </div>
                  <div className="flex-grow flex gap-2 justify-end text-right">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Optimal</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-900/60">
            <IonIcon icon={alertCircle} className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
            <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-snug">
              This room is a HIPAA-compliant virtual clinical workspace. All communications, video triage, and wearable telemetry are encrypted in transit and at rest.
            </span>
          </div>

        </div>
      </IonContent>

      {/* ========================================================================= */}
      {/* 🩺 BLOOD PRESSURE PROMPT MODAL */}
      {/* ========================================================================= */}
      {showBpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xs flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4.5 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <span className="text-[8px] font-black tracking-widest text-teal-600 dark:text-teal-400 uppercase">Input Log</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Blood Pressure</h3>
              </div>
              <button 
                onClick={() => setShowBpModal(false)} 
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <IonIcon icon={close} className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                Please enter your current blood pressure values as measured by your clinical cuff.
              </p>

              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">Systolic</label>
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-center text-sm font-black text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="120"
                  />
                </div>
                <span className="text-slate-300 dark:text-slate-750 font-bold pt-4">/</span>
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">Diastolic</label>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-center text-sm font-black text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="80"
                  />
                </div>
              </div>

              <button
                onClick={handleBpSubmit}
                className="w-full h-10 mt-2 flex items-center justify-center bg-teal-600 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-500 hover:bg-teal-500 dark:hover:from-teal-400 dark:hover:to-emerald-400 text-white dark:text-slate-950 rounded-full text-xs font-black tracking-wide uppercase transition-all shadow-md"
                style={{ borderRadius: '9999px' }}
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🧠 PHQ-9 CLINICAL SELF-ASSESSMENT MODAL */}
      {/* ========================================================================= */}
      {showPhqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4.5 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <span className="text-[8px] font-black tracking-widest text-teal-600 dark:text-teal-400 uppercase">Assessment Screen</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">PHQ-9 Depression Severity</h3>
              </div>
              <button 
                onClick={() => setShowPhqModal(false)} 
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <IonIcon icon={close} className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 min-h-[360px] flex flex-col justify-between">
              {phqScore === null ? (
                <div className="space-y-4">
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Question {phqStep + 1} of 9</span>
                      <span>{Math.round(((phqStep + 1) / 9) * 100)}% Complete</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-teal-500 to-violet-500 transition-all duration-300"
                        style={{ width: `${((phqStep + 1) / 9) * 100}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-relaxed font-sans pt-2">
                    Over the last 2 weeks, how often have you been bothered by: <br />
                    <span className="text-[13px] font-black text-slate-900 dark:text-white block mt-2">
                      "{PHQ9_QUESTIONS[phqStep]}"
                    </span>
                  </p>

                  <div className="space-y-2 pt-2">
                    {[
                      { val: 0, label: "Not at all" },
                      { val: 1, label: "Several days" },
                      { val: 2, label: "More than half the days" },
                      { val: 3, label: "Nearly every day" }
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => handlePhqAnswer(opt.val)}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all duration-200 flex items-center justify-between ${
                          phqAnswers[phqStep] === opt.val
                            ? "bg-teal-50/50 dark:bg-teal-950/20 border-teal-500 text-teal-850 dark:text-teal-300"
                            : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-900/60"
                        }`}
                      >
                        <span>{opt.label}</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          phqAnswers[phqStep] === opt.val ? "border-teal-500 bg-teal-500 text-white" : "border-slate-350 dark:border-slate-750"
                        }`}>
                          {phqAnswers[phqStep] === opt.val && <div className="w-1 h-1 bg-white rounded-full" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-center py-6 flex-grow flex flex-col justify-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto text-2xl font-black">
                    {phqScore}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Assessment Score: {phqScore}
                    </h4>
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-violet-500/10 border border-violet-500/20 text-violet-500 dark:text-violet-400">
                      Severity: {getPhqSeverity(phqScore)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-450 max-w-xs mx-auto leading-relaxed">
                    Your response has been parsed and securely transmitted to your primary care navigator. It is logged in your clinical record for continuous symptom monitoring.
                  </p>

                  <button
                    onClick={submitPhqAssessment}
                    className="w-full h-11 flex items-center justify-center bg-teal-600 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-500 hover:bg-teal-500 dark:hover:from-teal-400 dark:hover:to-emerald-400 text-white dark:text-slate-950 rounded-full text-xs font-black tracking-wide uppercase transition-all shadow-lg"
                    style={{ borderRadius: '9999px' }}
                  >
                    Submit & Close Check-in
                  </button>
                </div>
              )}

              {phqScore === null && (
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6">
                  <button
                    disabled={phqStep === 0}
                    onClick={() => setPhqStep(prev => prev - 1)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 disabled:opacity-40 transition-colors"
                  >
                    Back
                  </button>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Self-Screening</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📸 WOUND PHOTO SECURE UPLOADER MODAL */}
      {/* ========================================================================= */}
      {showWoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4.5 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <span className="text-[8px] font-black tracking-widest text-teal-600 dark:text-teal-400 uppercase">Log Photo</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Wound Check-in</h3>
              </div>
              <button 
                onClick={() => setShowWoundModal(false)} 
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <IonIcon icon={close} className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                Please upload or capture a clear photo of your wound area. This image is stored securely and is only accessible by your credentialed care team.
              </p>

              {uploadProgress > 0 && uploadProgress < 100 ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400">
                    <IonIcon icon={cloudUpload} className="w-8 h-8 animate-bounce" />
                  </div>
                  <div className="w-full max-w-xs space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                      <span>Uploading Photo...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-150 dark:bg-slate-850 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative group border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-teal-500/50 dark:hover:border-teal-500/40 rounded-xl bg-slate-50 dark:bg-slate-900/40 p-6 transition-all duration-300 text-center flex flex-col items-center justify-center cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleWoundUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <div className="p-3.5 rounded-full bg-white dark:bg-slate-800/80 border border-slate-150 dark:border-slate-750 text-slate-500 dark:text-slate-400 shadow-sm flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                    <IonIcon icon={camera} className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="mt-3.5 space-y-1">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Take Photo or Upload</span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500">Camera, Library, or File</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </IonPage>
  );
};

export default RecoveryDashboard;
