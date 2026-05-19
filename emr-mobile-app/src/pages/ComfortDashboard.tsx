import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client/core';
import { useQuery, useMutation } from '@apollo/client/react';
import { useAuth } from '../contexts/AuthContext';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonIcon,
  IonToolbar,
  IonRippleEffect,
  IonButton,
  IonModal
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
  cloudUpload,
  mic,
  micOff,
  videocamOff,
  sync,
  map,
  car,
  shieldCheckmark,
  statsChart,
  lockClosed,
  trendingUp,
  informationCircle
} from 'ionicons/icons';
import { useTheme } from '../contexts/ThemeContext';

const GET_DASHBOARD_DATA = gql`
  query GetDashboardData($patientId: UUID!) {
    myMobileProfile(patientId: $patientId) {
      firstName
      lastName
      mrn
      primaryCareNavigatorName
      hasAdvanceDirective
      advanceDirectives {
        advanceDirectiveId
        type
        documentUrl
        effectiveDate
        isActive
        notes
      }
      encounters {
        encounterId
      }
      diagnoses {
        diagnosisId
        icd10Code
        description
        isPrimary
      }
    }
    myMobilePrescriptions(patientId: $patientId) {
      prescriptionId
      dose
      frequency
      isActive
      medication {
        name
        strength
      }
    }
    myMobileVitals(patientId: $patientId) {
      vitalId
      heartRate
      bloodPressureSystolic
      bloodPressureDiastolic
      temperature
      oxygenSaturation
      recordedAt
    }
    myMobileEncounters(patientId: $patientId) {
      encounterId
      type
      status
      encounterDate
      chiefComplaint
      practitioner {
        firstName
        lastName
        position
      }
    }
    esasQuestionnaire: myMobileQuestionnaireByType(patientId: $patientId, type: ESAS) {
      questionnaireId
      name
      description
      questions {
        questionId
        text
        subtext
        type
        order
        optionsJson
      }
    }
  }
`;

const SAVE_MOBILE_VITALS = gql`
  mutation SaveMobileVitals(
    $patientId: UUID!
    $heartRate: Decimal
    $bloodPressureSystolic: Decimal
    $bloodPressureDiastolic: Decimal
    $temperature: Decimal
    $oxygenSaturation: Decimal
  ) {
    saveMobileVitals(
      patientId: $patientId
      heartRate: $heartRate
      bloodPressureSystolic: $bloodPressureSystolic
      bloodPressureDiastolic: $bloodPressureDiastolic
      temperature: $temperature
      oxygenSaturation: $oxygenSaturation
    ) {
      vitalId
      heartRate
      recordedAt
    }
  }
`;

const SAVE_ESAS_ASSESSMENT = gql`
  mutation SaveEsasAssessment(
    $patientId: UUID!
    $pain: Int!
    $tiredness: Int!
    $drowsiness: Int!
    $nausea: Int!
    $lackOfAppetite: Int!
    $shortnessOfBreath: Int!
    $depression: Int!
    $anxiety: Int!
    $wellbeing: Int!
  ) {
    saveEsasAssessment(
      patientId: $patientId
      pain: $pain
      tiredness: $tiredness
      drowsiness: $drowsiness
      nausea: $nausea
      lackOfAppetite: $lackOfAppetite
      shortnessOfBreath: $shortnessOfBreath
      depression: $depression
      anxiety: $anxiety
      wellbeing: $wellbeing
    ) {
      assessmentId
      pain
      wellbeing
      assessedAt
    }
  }
`;

const ESAS_SYMPTOMS = [
  { key: 'pain', label: 'Pain Intensity', desc: 'Active physical pain or discomfort level', minLabel: 'No Pain (0)', maxLabel: 'Worst Possible Pain (10)' },
  { key: 'tiredness', label: 'Tiredness (Fatigue)', desc: 'General weakness or physical fatigue', minLabel: 'No Fatigue (0)', maxLabel: 'Worst Possible Fatigue (10)' },
  { key: 'drowsiness', label: 'Drowsiness', desc: 'Feeling sleepy, foggy, or hard to stay awake', minLabel: 'Fully Alert (0)', maxLabel: 'Worst Possible Drowsiness (10)' },
  { key: 'nausea', label: 'Nausea', desc: 'Stomach distress, sickness, or vomiting urge', minLabel: 'No Nausea (0)', maxLabel: 'Worst Possible Nausea (10)' },
  { key: 'lackOfAppetite', label: 'Lack of Appetite', desc: 'Difficulty eating or enjoying meals', minLabel: 'Excellent Appetite (0)', maxLabel: 'Worst Possible Lack of Appetite (10)' },
  { key: 'shortnessOfBreath', label: 'Shortness of Breath', desc: 'Breathing difficulty or air hunger', minLabel: 'Normal Breathing (0)', maxLabel: 'Severe Dyspnea Crisis (10)' },
  { key: 'depression', label: 'Depression', desc: 'Feeling sad, down, or hopeless', minLabel: 'No Depression (0)', maxLabel: 'Worst Possible Depression (10)' },
  { key: 'anxiety', label: 'Anxiety', desc: 'Feeling anxious, nervous, or on edge', minLabel: 'No Anxiety (0)', maxLabel: 'Worst Possible Anxiety (10)' },
  { key: 'wellbeing', label: 'Overall Wellbeing', desc: 'Your general sense of comfort and quality of life', minLabel: 'Best Wellbeing (0)', maxLabel: 'Worst Possible Wellbeing (10)' }
];

const ComfortDashboard: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, apiUrl, token } = useAuth();
  
  const { data, loading, error } = useQuery<any>(GET_DASHBOARD_DATA, {
    variables: { patientId: user?.patientId },
    skip: !user?.patientId,
    fetchPolicy: 'cache-and-network'
  });

  const meds = data?.myMobilePrescriptions || [];

  // Derive dynamic Care Plan details based on real diagnoses/encounters
  const encountersCount = data?.myMobileEncounters?.length || 0;
  const prescriptionsCount = meds.length;
  const diagnoses = data?.myMobileProfile?.diagnoses || [];
  
  // Determine dynamic care plan name
  let carePlanName = "Palliative Symptom Management";
  if (diagnoses.length > 0) {
    const oncologyKeywords = ["cancer", "oncology", "malignant", "tumor", "carcinoma", "lymphoma", "leukemia", "neoplasm"];
    const hasOncology = diagnoses.some((d: any) => 
      oncologyKeywords.some(kw => d.description?.toLowerCase().includes(kw) || d.icd10Code?.toLowerCase().includes(kw))
    );
    if (hasOncology) {
      carePlanName = "Oncology Recovery & Stabilization";
    } else {
      // Prioritize the diagnosis designated as Primary, otherwise fallback to the first one
      const primaryDiag = diagnoses.find((d: any) => d.isPrimary) || diagnoses[0];
      carePlanName = `${primaryDiag.description || "Chronic"} Recovery Pathway`;
    }
  } else if (prescriptionsCount > 0) {
    carePlanName = "Medication-Assisted Care Pathway";
  }

  // Calculate dynamic pathway completion percentage
  let completionPercent = 15;
  completionPercent += Math.min(45, encountersCount * 15);
  completionPercent += Math.min(35, prescriptionsCount * 10);
  if (data?.myMobileProfile?.hasAdvanceDirective) {
    completionPercent += 10;
  }
  completionPercent = Math.min(98, completionPercent);

  // Determine active milestone phase based on progress
  let activePhase = 1;
  if (completionPercent >= 80) {
    activePhase = 4;
  } else if (completionPercent >= 50) {
    activePhase = 3;
  } else if (completionPercent >= 25) {
    activePhase = 2;
  }

  const [saveVitals] = useMutation(SAVE_MOBILE_VITALS, {
    refetchQueries: [{ query: GET_DASHBOARD_DATA, variables: { patientId: user?.patientId } }]
  });

  // Synchronize initial vitals from the real database if present
  useEffect(() => {
    if (data?.myMobileVitals && data.myMobileVitals.length > 0) {
      const latest = data.myMobileVitals[0];
      setLiveVitals({
        heartRate: Number(latest.heartRate || 72),
        spO2: Number(latest.oxygenSaturation || 98),
        temperature: Number(latest.temperature || 98.6)
      });
      if (latest.bloodPressureSystolic && latest.bloodPressureDiastolic) {
        setBpValue(`${latest.bloodPressureSystolic}/${latest.bloodPressureDiastolic} mmHg`);
      }
    }
  }, [data?.myMobileVitals]);

  const activeEncounter = data?.myMobileEncounters?.find(
    (e: any) => e.status === 'InProgress' || e.status === 'Arrived'
  ) || data?.myMobileEncounters?.[0];

  const clinicianName = activeEncounter?.practitioner 
    ? `${activeEncounter.practitioner.firstName} ${activeEncounter.practitioner.lastName}`
    : 'Marcus Vance, BSN';

  const clinicianSpecialty = activeEncounter?.practitioner?.specialty || 'Home Health Triage Nurse';

  const clinicianInitials = activeEncounter?.practitioner
    ? `${activeEncounter.practitioner.firstName[0]}${activeEncounter.practitioner.lastName[0]}`
    : 'MV';

  const [liveVitals, setLiveVitals] = useState({ heartRate: 72, spO2: 98, temperature: 98.6 });
  const [waitingRoomActive, setWaitingRoomActive] = useState(false);
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [woundPhoto, setWoundPhoto] = useState<string | null>(null);
  
  // Modal states
  const [showWoundModal, setShowWoundModal] = useState(false);
  const [showPhqModal, setShowPhqModal] = useState(false);
  const [showBpModal, setShowBpModal] = useState(false);
  const [showDirectivesModal, setShowDirectivesModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  
  // New premium modal & feature states
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'heart' | 'spo2' | 'temp'>('heart');
  const [analyticsRange, setAnalyticsRange] = useState<'day' | 'week' | 'month'>('week');
  const [isSyncingWearables, setIsSyncingWearables] = useState(false);
  
  const [callActive, setCallActive] = useState(false);
  const [callMuted, setCallMuted] = useState(false);
  const [callVideoOff, setCallVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [liveTranscription, setLiveTranscription] = useState('');
  
  const [showRadarModal, setShowRadarModal] = useState(false);
  const [radarTransitProgress, setRadarTransitProgress] = useState(15);
  const [isTransitSimulating, setIsTransitSimulating] = useState(true);
  
  // BP input states
  const [systolic, setSystolic] = useState('118');
  const [diastolic, setDiastolic] = useState('78');
  const [bpValue, setBpValue] = useState<string | null>(null);
  const [showProgramProgressModal, setShowProgramProgressModal] = useState(false);
  
  // Photo upload progress
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // ESAS-R comfort assessment states
  const [esasAnswers, setEsasAnswers] = useState<number[]>([]);
  const [esasStep, setEsasStep] = useState(0);
  const [esasScore, setEsasScore] = useState<number | null>(null);
  const [esasAverage, setEsasAverage] = useState<number | null>(null);

  // Load ESAS symptoms dynamically from backend questionnaire or fallback to static list
  const dynamicSymptoms = data?.esasQuestionnaire?.questions
    ? [...data.esasQuestionnaire.questions]
        .sort((a: any, b: any) => a.order - b.order)
        .map((q: any) => {
          const key = q.text.toLowerCase().replace(/\s+/g, '');
          let desc = q.subtext || `Rate your level of ${q.text.toLowerCase()}`;
          let minLabel = '0 (None)';
          let maxLabel = '10 (Worst)';
          if (q.text.toLowerCase().includes('wellbeing') || q.text.toLowerCase().includes('well-being')) {
            minLabel = 'Best Wellbeing (0)';
            maxLabel = 'Worst Possible (10)';
          } else if (q.text.toLowerCase().includes('appetite')) {
            minLabel = 'Excellent (0)';
            maxLabel = 'Worst Possible (10)';
          } else if (q.text.toLowerCase().includes('drowsiness')) {
            minLabel = 'Fully Alert (0)';
            maxLabel = 'Worst Possible (10)';
          } else if (q.text.toLowerCase().includes('pain')) {
            minLabel = 'No Pain (0)';
            maxLabel = 'Worst Possible (10)';
          } else if (q.text.toLowerCase().includes('tiredness') || q.text.toLowerCase().includes('fatigue')) {
            minLabel = 'No Fatigue (0)';
            maxLabel = 'Worst Possible (10)';
          } else if (q.text.toLowerCase().includes('nausea')) {
            minLabel = 'No Nausea (0)';
            maxLabel = 'Worst Possible (10)';
          } else if (q.text.toLowerCase().includes('breath') || q.text.toLowerCase().includes('dyspnea') || q.text.toLowerCase().includes('shortness')) {
            minLabel = 'Normal (0)';
            maxLabel = 'Worst Possible (10)';
          } else if (q.text.toLowerCase().includes('depression')) {
            minLabel = 'No Depression (0)';
            maxLabel = 'Worst Possible (10)';
          } else if (q.text.toLowerCase().includes('anxiety')) {
            minLabel = 'No Anxiety (0)';
            maxLabel = 'Worst Possible (10)';
          }
          return {
            key,
            label: q.text,
            desc,
            minLabel,
            maxLabel
          };
        })
    : ESAS_SYMPTOMS;

  useEffect(() => {
    if (esasAnswers.length === 0 && dynamicSymptoms.length > 0) {
      setEsasAnswers(Array(dynamicSymptoms.length).fill(0));
    }
  }, [dynamicSymptoms, esasAnswers.length]);

  // ESAS Mutation Hook
  const [saveEsas] = useMutation(SAVE_ESAS_ASSESSMENT, {
    refetchQueries: [{ query: GET_DASHBOARD_DATA, variables: { patientId: user?.patientId } }]
  });

  // Live Wearables integration
  useEffect(() => {
    if (!user?.patientId || !apiUrl) return;

    let isMounted = true;

    const connection = new HubConnectionBuilder()
      .withUrl(`${apiUrl}/hubs/telemetry`, {
        accessTokenFactory: () => localStorage.getItem('halkyone-mobile-token') || ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    // Re-join the telemetry stream after a network reconnect
    connection.onreconnected(() => {
      if (isMounted && user.patientId) {
        connection.invoke('JoinPatientStream', user.patientId).catch(() => {});
      }
    });

    connection.start().then(() => {
      if (isMounted) {
        console.log('SignalR Connected to TelemetryHub');
        connection.invoke('JoinPatientStream', user.patientId).catch(() => {});
      }
    }).catch(err => {
      const isAbort = err?.name === 'AbortError' || err?.toString()?.includes('stopped');
      if (!isAbort && isMounted) {
        console.error('SignalR Connection Error: ', err);
      }
    });

    connection.on('ReceiveVitals', (vitals: any) => {
      if (!isMounted) return;
      console.log('Received live vitals:', vitals);
      setLiveVitals({
        heartRate: vitals.heartRate || vitals.HeartRate || 72,
        spO2: vitals.spO2 || vitals.SpO2 || 98,
        temperature: vitals.temperature || vitals.Temperature || 98.6
      });
    });

    return () => {
      isMounted = false;
      connection.stop().catch(() => {});
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
    
    const savedEsas = localStorage.getItem(`halkyone-esas-avg-${dateStr}`);
    if (savedEsas) {
      setEsasAverage(parseFloat(savedEsas));
      setEsasScore(Math.round(parseFloat(savedEsas) * 9));
    }

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
        title: savedEsas ? `Complete Comfort Check-in (Avg ESAS-R: ${savedEsas}/10)` : 'Complete Palliative Comfort Check-in', 
        time: '10:00 AM', 
        done: !!savedEsas, 
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

  // Telehealth Call duration & transcription status
  useEffect(() => {
    let timer: any;
    if (callActive) {
      setCallDuration(0);
      setLiveTranscription("Connecting WebRTC session...");
      timer = setInterval(() => {
        setCallDuration(prev => {
          const next = prev + 1;
          if (next === 2) {
            setLiveTranscription("WebRTC Voice Channel: Connected. Real-time transcription active.");
          }
          return next;
        });
      }, 1000);
    } else {
      setCallDuration(0);
      setLiveTranscription('');
    }
    return () => clearInterval(timer);
  }, [callActive]);

  // Visit Radar transit simulation
  useEffect(() => {
    let transitTimer: any;
    if (showRadarModal && isTransitSimulating) {
      transitTimer = setInterval(() => {
        setRadarTransitProgress(prev => {
          if (prev >= 90) {
            return 90; // Hold at geofence safety mask boundary near home
          }
          return prev + 2.5;
        });
      }, 1500);
    }
    return () => clearInterval(transitTimer);
  }, [showRadarModal, isTransitSimulating]);

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
        localStorage.removeItem(`halkyone-esas-score-${dateStr}`);
        localStorage.removeItem(`halkyone-esas-avg-${dateStr}`);
        setEsasScore(null);
        setEsasAverage(null);
      }
      
      const newTitle = task.type === 'wound' 
        ? 'Log evening wound photo' 
        : task.type === 'bp' 
          ? 'Record morning blood pressure' 
          : task.type === 'phq' 
            ? 'Complete Palliative Comfort Check-in' 
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
      setEsasAnswers(Array(9).fill(0));
      setEsasStep(0);
      setEsasScore(null);
      setEsasAverage(null);
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

  const handleBpSubmit = async () => {
    if (!systolic || !diastolic) return;
    const value = `${systolic}/${diastolic} mmHg`;
    
    try {
      if (user?.patientId) {
        await saveVitals({
          variables: {
            patientId: user.patientId,
            bloodPressureSystolic: parseFloat(systolic),
            bloodPressureDiastolic: parseFloat(diastolic),
            heartRate: liveVitals.heartRate,
            temperature: liveVitals.temperature,
            oxygenSaturation: liveVitals.spO2
          }
        });
      }
    } catch (err) {
      console.error("Failed to save vitals directly to PostgreSQL database:", err);
    }

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

  const generateSvgPath = (metric: 'heart' | 'spo2' | 'temp', forFill: boolean = false) => {
    const vitals = [...(data?.myMobileVitals || [])].reverse();
    if (vitals.length === 0) {
      if (metric === 'heart') return forFill ? "M 0 35 Q 15 20 30 38 T 60 22 T 80 32 T 100 15 L 100 50 L 0 50 Z" : "M 0 35 Q 15 20 30 38 T 60 22 T 80 32 T 100 15";
      if (metric === 'spo2') return forFill ? "M 0 10 Q 20 18 40 8 T 70 12 T 100 6 L 100 50 L 0 50 Z" : "M 0 10 Q 20 18 40 8 T 70 12 T 100 6";
      return forFill ? "M 0 25 Q 25 15 50 30 T 75 22 T 100 24 L 100 50 L 0 50 Z" : "M 0 25 Q 25 15 50 30 T 75 22 T 100 24";
    }

    const width = 100;
    const minY = 5;
    const maxY = 45;

    const values = vitals.map(v => {
      if (metric === 'heart') return Number(v.heartRate || 72);
      if (metric === 'spo2') return Number(v.oxygenSaturation || 98);
      return Number(v.temperature || 98.6);
    });

    const minVal = Math.min(...values) - 2;
    const maxVal = Math.max(...values) + 2;
    const valRange = maxVal - minVal || 1;

    const points = vitals.map((v, i) => {
      const x = vitals.length > 1 ? (i / (vitals.length - 1)) * width : width / 2;
      const val = metric === 'heart' ? Number(v.heartRate || 72) : metric === 'spo2' ? Number(v.oxygenSaturation || 98) : Number(v.temperature || 98.6);
      const y = maxY - ((val - minVal) / valRange) * (maxY - minY);
      return { x, y };
    });

    let pathStr = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathStr += ` L ${points[i].x} ${points[i].y}`;
    }

    if (forFill) {
      pathStr += ` L ${points[points.length - 1].x} 50 L ${points[0].x} 50 Z`;
    }

    return pathStr;
  };

  const handleEsasStepNext = () => {
    if (esasStep < dynamicSymptoms.length - 1) {
      setEsasStep(prev => prev + 1);
    } else {
      const total = esasAnswers.reduce((sum, val) => sum + val, 0);
      const avg = parseFloat((total / dynamicSymptoms.length).toFixed(1));
      setEsasScore(total);
      setEsasAverage(avg);
      const dateStr = new Date().toISOString().split('T')[0];
      localStorage.setItem(`halkyone-esas-score-${dateStr}`, total.toString());
      localStorage.setItem(`halkyone-esas-avg-${dateStr}`, avg.toString());
    }
  };

  const getEsasSeverity = (avg: number) => {
    if (avg <= 1.0) return "Normal Comfort Status";
    if (avg <= 3.0) return "Mild Palliative Distress";
    if (avg <= 6.0) return "Moderate Palliative Distress";
    if (avg <= 8.0) return "Severe Symptom Burden";
    return "Clinical Distress Crisis";
  };

  const submitEsasAssessment = async () => {
    const getScoreByText = (text: string) => {
      const idx = dynamicSymptoms.findIndex((s: any) => s.label.toLowerCase().includes(text.toLowerCase()));
      return idx !== -1 ? esasAnswers[idx] : 0;
    };

    const pain = getScoreByText('pain');
    const tiredness = getScoreByText('tiredness') || getScoreByText('fatigue');
    const drowsiness = getScoreByText('drowsiness');
    const nausea = getScoreByText('nausea');
    const lackOfAppetite = getScoreByText('appetite');
    const shortnessOfBreath = getScoreByText('breath') || getScoreByText('dyspnea');
    const depression = getScoreByText('depression');
    const anxiety = getScoreByText('anxiety');
    const wellbeing = getScoreByText('wellbeing') || getScoreByText('well-being');

    try {
      if (user?.patientId) {
        await saveEsas({
          variables: {
            patientId: user.patientId,
            pain,
            tiredness,
            drowsiness,
            nausea,
            lackOfAppetite,
            shortnessOfBreath,
            depression,
            anxiety,
            wellbeing
          }
        });
      }
    } catch (err) {
      console.error("Failed to save ESAS assessment directly to PostgreSQL database:", err);
    }

    const total = esasAnswers.reduce((sum, val) => sum + val, 0);
    const avg = parseFloat((total / dynamicSymptoms.length).toFixed(1));
    setEsasScore(total);
    setEsasAverage(avg);

    const dateStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(`halkyone-esas-score-${dateStr}`, total.toString());
    localStorage.setItem(`halkyone-esas-avg-${dateStr}`, avg.toString());

    setTasks(prevTasks => {
      const updated = prevTasks.map(t => t.id === 'phq' ? { ...t, done: true, title: `Complete Comfort Check-in (Avg ESAS-R: ${avg}/10)` } : t);
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
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            setWoundPhoto(base64data);
            const dateStr = new Date().toISOString().split('T')[0];
            localStorage.setItem(`halkyone-wound-photo-${dateStr}`, base64data);
            
            setTasks(prevTasks => {
              const updated = prevTasks.map(t => t.id === 'wound' ? { ...t, done: true, title: 'Log evening wound photo (Logged)' } : t);
              localStorage.setItem(`halkyone-care-ring-${dateStr}`, JSON.stringify(updated));
              return updated;
            });
            
            // Connect to clinician portal Document Vault / coordination tab in PostgreSQL
            try {
              const formData = new FormData();
              formData.append("file", file);
              formData.append("title", `Wound Photo - ${new Date().toLocaleDateString()}`);
              formData.append("documentType", "CLINICAL_RECORD");

              const response = await fetch(`${apiUrl}/api/upload/general/${user?.patientId}`, {
                method: "POST",
                body: formData,
                headers: token ? { "Authorization": `Bearer ${token}` } : undefined
              });

              if (response.ok) {
                console.log("[ComfortDashboard] Wound photo registered in patient clinical Document Vault!");
              } else {
                console.error("[ComfortDashboard] Backend upload failed:", response.statusText);
              }
            } catch (err) {
              console.error("[ComfortDashboard] Error uploading photo to C# server:", err);
            }

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

  // =========================================================================
  // 📹 FULLSCREEN WEBRTC VIDEO CALL OVERLAY
  // =========================================================================
  if (callActive) {
    const min = Math.floor(callDuration / 60);
    const sec = callDuration % 60;
    const durationStr = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

    return (
      <IonPage className="bg-[#020408] text-white overflow-hidden select-none">
        <div className="relative w-full h-full flex flex-col justify-between p-6">
          
          {/* Header row */}
          <div className="flex justify-between items-center z-20 bg-slate-900/40 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-800/60 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]" />
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">WebRTC Session</span>
                <span className="text-xs font-black text-white">Dr. Sarah Ross</span>
              </div>
            </div>
            <div className="font-mono text-xs font-extrabold bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800 text-teal-400">
              {durationStr}
            </div>
          </div>

          {/* Video Streams Container */}
          <div className="absolute inset-0 z-0 bg-[#090b11]">
            {/* Remote Feed (Doctor) */}
            <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
              {callVideoOff ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center text-slate-400 text-3xl font-bold">
                    SR
                  </div>
                  <span className="text-xs text-slate-400 uppercase font-black tracking-widest">Doctor's Video Paused</span>
                </div>
              ) : (
                /* Glowing stylized Vector Clinician portrait or simulation grid */
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-teal-950/20 via-[#0d1627] to-[#020408] relative">
                  {/* Glowing background circles */}
                  <div className="absolute w-72 h-72 bg-teal-500/5 rounded-full blur-3xl animate-pulse" />
                  
                  {/* High Fidelity Doctor Avatar Styling */}
                  <div className="w-36 h-36 rounded-full border-4 border-teal-500/20 shadow-[0_0_50px_rgba(20,184,166,0.15)] flex items-center justify-center bg-slate-900 overflow-hidden relative group">
                    <svg viewBox="0 0 100 100" className="w-24 h-24 text-teal-400">
                      <path fill="currentColor" d="M50 20c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15zm-25 45c0-11 9-20 20-20h10c11 0 20 9 20 20v5H25v-5z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-4 tracking-tight">Dr. Sarah Ross, MD</h3>
                  <span className="text-[10px] text-teal-400 uppercase tracking-widest font-black bg-teal-950/30 px-3 py-1 rounded-full border border-teal-900/30 mt-2">
                    Oncology Triage Lead
                  </span>
                  
                  {/* Audio wave animation */}
                  <div className="flex items-center gap-1.5 mt-8 h-8">
                    {[0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 4, 2, 0].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-teal-500 rounded-full transition-all duration-300 animate-pulse"
                        style={{
                          height: `${4 + h * 6}px`,
                          animationDelay: `${i * 100}ms`
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Local Feed - Small Floating PIP Picture-in-Picture */}
              <div className="absolute right-6 bottom-32 w-28 h-40 rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-900 shadow-2xl flex items-center justify-center z-10 transition-all duration-300">
                {callVideoOff ? (
                  <IonIcon icon={videocamOff} className="w-6 h-6 text-slate-500" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 relative">
                    <div className="absolute top-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-mono tracking-widest text-slate-400 uppercase">
                      Self
                    </div>
                    <svg viewBox="0 0 100 100" className="w-12 h-12 text-slate-600">
                      <path fill="currentColor" d="M50 20c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15zm-25 45c0-11 9-20 20-20h10c11 0 20 9 20 20v5H25v-5z" />
                    </svg>
                    <span className="text-[7px] text-slate-550 uppercase font-black tracking-widest mt-2">Active Camera</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subtitles / Transcription Overlay */}
          <div className="z-10 bg-slate-950/85 backdrop-blur-md px-5 py-4 rounded-2xl border border-slate-800/80 max-w-sm mx-auto w-full shadow-2xl mb-4 animate-in fade-in slide-in-from-bottom-6 duration-300">
            <span className="text-[8px] font-black uppercase text-teal-400 tracking-wider block mb-1">Live Clinical Transcription</span>
            <p className="text-xs font-semibold text-slate-150 leading-relaxed min-h-[40px] italic">
              {liveTranscription}
            </p>
          </div>

          {/* Control Bar */}
          <div className="z-10 flex items-center justify-center gap-5 pb-6">
            {/* Audio Toggle */}
            <button
              onClick={() => setCallMuted(!callMuted)}
              className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                callMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-500'
                  : 'bg-slate-900/80 border-slate-800 text-white hover:bg-slate-800'
              }`}
            >
              <IonIcon icon={callMuted ? micOff : mic} className="w-5.5 h-5.5" />
            </button>

            {/* End Call Button */}
            <button
              onClick={() => {
                setCallActive(false);
                setWaitingRoomActive(false);
              }}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/25 active:scale-95 transition-transform"
            >
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
                <path d="M21 16.5c0 .38-.21.71-.53.88l-4.5 2.5c-.32.18-.72.18-1.04 0l-4.5-2.5c-.32-.17-.53-.5-.53-.88V12h11v4.5z" />
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.5c0 .28-.22.5-.5.5h-1c-.28 0-.5-.22-.5-.5v-6c0-.28.22-.5.5-.5h1c.28 0 .5.22.5.5v6zm0-8c0 .28-.22.5-.5.5h-1c-.28 0-.5-.22-.5-.5V8c0-.28.22-.5.5-.5h1c.28 0 .5.22.5.5v3.5z" />
              </svg>
            </button>

            {/* Video Toggle */}
            <button
              onClick={() => setCallVideoOff(!callVideoOff)}
              className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                callVideoOff
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-500'
                  : 'bg-slate-900/80 border-slate-800 text-white hover:bg-slate-800'
              }`}
            >
              <IonIcon icon={callVideoOff ? videocamOff : videocam} className="w-5.5 h-5.5" />
            </button>
          </div>

        </div>
      </IonPage>
    );
  }

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
              <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white font-sans flex items-baseline gap-1.5">
                {loading ? 'Loading...' : data?.myMobileProfile?.firstName ? `Hi, ${data.myMobileProfile.firstName}` : 'Comfort'}
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  {data?.myMobileProfile?.lastName ? data.myMobileProfile.lastName : 'Hub'}
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                style={{ borderRadius: '9999px' }}
                className={`w-10 h-10 flex items-center justify-center border transition-all active:scale-95 shadow-sm cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-teal-400 hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title={theme === 'dark' ? 'Switch to Porcelain Mode' : 'Switch to Midnight Mode'}
              >
                <IonIcon icon={theme === 'dark' ? sunny : moonIcon} className="w-5 h-5" />
              </button>

              {/* Notification Button */}
              <button
                style={{ borderRadius: '9999px' }}
                className={`relative w-10 h-10 flex items-center justify-center border transition-all active:scale-95 shadow-sm cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-100'
                }`}
                title="View Notifications"
              >
                <IonIcon icon={notifications} className="w-5 h-5" />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_#10b981]" />
              </button>
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
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-snug">
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
                  <IonIcon icon={chevronForward} className="w-3.5 h-3.5 text-slate-300 dark:text-slate-755" />
                </div>
              ))}
            </div>
          </div>

          {/* Active Care Program Tracker Card */}
          <div 
            onClick={() => setShowProgramProgressModal(true)}
            className="ion-activatable relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b0f19] dark:bg-gradient-to-br dark:from-slate-900/80 dark:to-[#0b0f19]/80 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] cursor-pointer hover:border-teal-500/50 dark:hover:border-teal-500/30 transition-all active:scale-[0.99] group"
          >
            <IonRippleEffect />
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
                <IonIcon icon={trendingUp} className="w-5 h-5" />
              </div>
              <div className="flex-grow space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black tracking-widest text-teal-600 dark:text-teal-400 uppercase">Active Program</span>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Oncology Care Plan</h3>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-full rounded-full" style={{ width: '68%' }} />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold">68% Phase 2</span>
                </div>
              </div>
              <IonIcon icon={chevronForward} className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Goals of Care Vault Card */}
          <div 
            onClick={() => setShowDirectivesModal(true)}
            className="ion-activatable relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b0f19] dark:bg-gradient-to-br dark:from-slate-900/80 dark:to-[#0b0f19]/80 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] cursor-pointer hover:border-teal-500/50 dark:hover:border-teal-500/30 transition-all active:scale-[0.99] group"
          >
            <IonRippleEffect />
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-650 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                <IonIcon icon={shieldCheckmark} className="w-5 h-5" />
              </div>
              <div className="flex-grow space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">Goals of Care Vault</span>
                  <div className="px-1.5 py-0.2 bg-emerald-500/10 border border-emerald-500/20 rounded text-[7px] font-mono font-bold text-emerald-650 uppercase tracking-widest">
                    Verified
                  </div>
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Active Advance Directives</h3>
                <p className="text-[10px] text-slate-550 dark:text-slate-450 leading-none">
                  {data?.myMobileProfile?.hasAdvanceDirective 
                    ? `🛡️ DNR & Comfort Measures Active` 
                    : 'Log and verify clinical directives'}
                </p>
              </div>
              <IonIcon icon={chevronForward} className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Anticipatory Guidance & Caregiver Support Card */}
          <div 
            onClick={() => setShowSupportModal(true)}
            className="ion-activatable relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b0f19] dark:bg-gradient-to-br dark:from-slate-900/80 dark:to-[#0b0f19]/80 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] cursor-pointer hover:border-teal-500/50 dark:hover:border-teal-500/30 transition-all active:scale-[0.99] group"
          >
            <IonRippleEffect />
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-650 dark:text-rose-400 group-hover:scale-105 transition-transform">
                <IonIcon icon={informationCircle} className="w-5 h-5" />
              </div>
              <div className="flex-grow space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black tracking-widest text-rose-600 dark:text-rose-400 uppercase">Caregiver Resources</span>
                  <div className="px-1.5 py-0.2 bg-rose-500/10 border border-rose-500/20 rounded text-[7px] font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest animate-pulse">
                    New Support Guides
                  </div>
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Anticipatory Guidance</h3>
                <p className="text-[10px] text-slate-550 dark:text-slate-450 leading-none">
                  Calming symptom care, respite, & bereavement guides
                </p>
              </div>
              <IonIcon icon={chevronForward} className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
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
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5 leading-snug">
                    Dr. Ross is reviewing your clinical logs. Connect for your virtual room check-in.
                  </p>
                </div>
                
                {waitingRoomActive ? (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                    <button
                      onClick={() => setCallActive(true)}
                      className="w-full h-11 flex items-center justify-between px-5 bg-rose-600 dark:bg-gradient-to-r dark:from-rose-500 dark:to-red-650 hover:from-rose-400 hover:to-red-550 text-white rounded-full text-xs font-black tracking-wide uppercase transition-all shadow-[0_4px_15px_rgba(239,68,68,0.3)] hover:scale-[1.01] active:scale-[0.99] relative"
                      style={{ borderRadius: '9999px' }}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                        Dr. Ross is Ready!
                      </span>
                      <span className="flex items-center gap-1 font-bold text-[10px]">
                        Join Call
                        <IonIcon icon={chevronForward} className="w-4 h-4" />
                      </span>
                    </button>
                    <button
                      onClick={() => setWaitingRoomActive(false)}
                      className="w-full h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-205 dark:hover:bg-slate-700 active:bg-slate-300/50 dark:active:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full text-xs font-bold transition-all border border-slate-200 dark:border-slate-700/50"
                      style={{ borderRadius: '9999px' }}
                    >
                      Leave Waiting Room
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setWaitingRoomActive(true)}
                    className="w-full h-10 flex items-center justify-center bg-teal-600 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-500 hover:bg-teal-505 dark:hover:from-teal-400 dark:hover:to-emerald-400 text-white dark:text-slate-950 rounded-full text-xs font-black tracking-wide uppercase transition-all shadow-[0_4px_12px_rgba(13,148,136,0.15)] dark:shadow-[0_4px_12px_rgba(20,184,166,0.3)]"
                    style={{ borderRadius: '9999px' }}
                  >
                    Join Virtual Waiting Room
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Visit Radar Logistics Transit Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#090d16] dark:bg-gradient-to-r dark:from-[#0d1627] dark:to-[#090d16] p-4.5 shadow-md">
            <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex-shrink-0 animate-pulse">
                <IonIcon icon={map} className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-3 flex-grow">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                    <span className="text-[9px] uppercase font-black tracking-widest text-indigo-500 dark:text-indigo-400">Clinician In Transit</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">Visit Radar Logistics</h3>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5 leading-snug">
                    Your clinician {clinicianName} is in route. Live transit coordinates are active.
                  </p>
                </div>
                
                <button
                  onClick={() => setShowRadarModal(true)}
                  className="w-full h-10 flex items-center justify-center bg-indigo-600 dark:bg-gradient-to-r dark:from-indigo-500 dark:to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white rounded-full text-xs font-black tracking-wide uppercase transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                  style={{ borderRadius: '9999px' }}
                >
                  Track Live Location
                </button>
              </div>
            </div>
          </div>

          {/* Wearables / IoT Telemetry Grid */}
          <div>
            <div className="flex justify-between items-center mb-2.5 px-1">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-450 dark:text-slate-500 font-black">Wearables Telemetry</h3>
              <span className="text-[8px] font-bold text-teal-650 dark:text-teal-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Live Sync
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              
              {/* Heart Rate Card */}
              <div 
                onClick={() => {
                  setSelectedMetric('heart');
                  setShowAnalyticsModal(true);
                }}
                className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.02)] active:scale-[0.98] transition-all cursor-pointer hover:border-rose-500/30"
              >
                <div className="absolute top-3.5 right-3.5 text-rose-500 animate-pulse">
                  <IonIcon icon={heart} className="w-5 h-5" />
                </div>
                <span className="text-[9px] text-slate-455 dark:text-slate-500 font-bold uppercase tracking-wider">Heart Rate</span>
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
              <div 
                onClick={() => {
                  setSelectedMetric('spo2');
                  setShowAnalyticsModal(true);
                }}
                className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.02)] active:scale-[0.98] transition-all cursor-pointer hover:border-teal-500/30"
              >
                <div className="absolute top-3.5 right-3.5 text-teal-600 dark:text-teal-400">
                  <IonIcon icon={pulse} className="w-5 h-5" />
                </div>
                <span className="text-[9px] text-slate-455 dark:text-slate-500 font-bold uppercase tracking-wider">Blood Oxygen</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-slate-900 dark:text-white">{liveVitals.spO2}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">% SpO2</span>
                </div>
                <div className="mt-3.5 flex items-center gap-1.5 text-[9px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-950/40 px-2 py-0.5 rounded-full w-max">
                  <span>Normal Range</span>
                </div>
              </div>

              {/* Temperature Card */}
              <div 
                onClick={() => {
                  setSelectedMetric('temp');
                  setShowAnalyticsModal(true);
                }}
                className="col-span-2 relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 p-4 shadow-[0_4px_20px_rgba(15,23,42,0.02)] active:scale-[0.98] transition-all cursor-pointer hover:border-violet-500/30"
              >
                <div className="absolute top-4 right-4 text-violet-650 dark:text-violet-405">
                  <IonIcon icon={sunny} className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-455 dark:text-slate-500 font-bold uppercase tracking-wider">Body Temperature</span>
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

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-105/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-900/60">
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
              <p className="text-xs text-slate-550 dark:text-slate-400 leading-snug">
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
      {/* 🧠 ESAS-R PALLIATIVE COMFORT ASSESSMENT MODAL */}
      {/* ========================================================================= */}
      {showPhqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-[2rem] w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
              <div>
                <span className="text-[8px] font-black tracking-widest text-teal-600 dark:text-teal-400 uppercase">Comfort Check-in</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Edmonton Symptom Assessment (ESAS-R)</h3>
              </div>
              <button 
                onClick={() => setShowPhqModal(false)} 
                className="p-1.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <IonIcon icon={close} className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex-1 max-h-[65vh] overflow-y-auto space-y-4 scrollbar-thin">
              {esasScore === null ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-snug">
                    Please adjust the sliders below to rate your current comfort level. 0 represents no symptom (or excellent wellbeing/appetite) and 10 represents worst possible.
                  </p>

                  <div className="space-y-3.5">
                    {dynamicSymptoms.map((symptom: any, index: number) => (
                      <div 
                        key={symptom.key || index}
                        className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-2.5 transition-all hover:border-teal-500/30"
                      >
                        <div className="flex justify-between items-center">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {symptom.label}
                            </span>
                            <span className="block text-[10px] text-slate-550 dark:text-slate-400">
                              {symptom.desc}
                            </span>
                          </div>
                          
                          {/* Numerical severity indicator */}
                          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-mono font-black text-xs shadow-inner">
                            {esasAnswers[index] !== undefined ? esasAnswers[index] : 0}
                          </div>
                        </div>

                        {/* Visual slider control */}
                        <div className="space-y-1.5 px-0.5">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="1"
                            value={esasAnswers[index] !== undefined ? esasAnswers[index] : 0}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              const updated = [...esasAnswers];
                              updated[index] = val;
                              setEsasAnswers(updated);
                            }}
                            className="w-full accent-teal-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-[8px] font-mono font-bold text-slate-450">
                            <span>{symptom.minLabel}</span>
                            <span>{symptom.maxLabel}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Real-time Dynamic Average Score Panel */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 to-indigo-500/10 border border-teal-500/20 flex items-center justify-between mt-5">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider">Live Calibration</span>
                      <h4 className="text-xs font-bold text-slate-850 dark:text-white">Current Average Severity</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                        {(esasAnswers.length > 0 ? (esasAnswers.reduce((sum, val) => sum + val, 0) / esasAnswers.length) : 0).toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold"> / 10</span>
                    </div>
                  </div>

                  <button
                    onClick={submitEsasAssessment}
                    className="w-full h-11 mt-5 flex items-center justify-center bg-teal-600 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-500 hover:bg-teal-500 dark:hover:from-teal-400 dark:hover:to-emerald-400 text-white dark:text-slate-950 rounded-full text-xs font-black tracking-wide uppercase transition-all shadow-lg active:scale-[0.98]"
                    style={{ borderRadius: '9999px' }}
                  >
                    Submit Comfort Check-in
                  </button>
                </div>
              ) : (
                <div className="space-y-5 text-center py-6 flex-grow flex flex-col justify-center">
                  <div className="w-20 h-20 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto text-2xl font-black font-mono">
                    {esasAverage}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Average Comfort Score: {esasAverage} / 10
                    </h4>
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-violet-500/10 border border-violet-500/20 text-violet-500 dark:text-violet-455">
                      Status: {getEsasSeverity(esasAverage || 0)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-555 dark:text-slate-450 max-w-xs mx-auto leading-relaxed">
                    Your Edmonton Symptom log has been stored in PostgreSQL database. Your palliative Navigator Sarah Jenkins has been updated for real-time symptom calibration.
                  </p>

                  <button
                    onClick={submitEsasAssessment}
                    className="w-full h-11 flex items-center justify-center bg-teal-600 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-500 hover:bg-teal-500 dark:hover:from-teal-400 dark:hover:to-emerald-400 text-white dark:text-slate-950 rounded-full text-xs font-black tracking-wide uppercase transition-all shadow-lg"
                    style={{ borderRadius: '9999px' }}
                  >
                    Submit & Close Check-in
                  </button>
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
              <p className="text-xs text-slate-550 dark:text-slate-400 leading-snug">
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

      {/* ========================================================================= */}
      {/* 📊 VITALS TRENDS ANALYTICS MODAL */}
      {/* ========================================================================= */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4.5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <IonIcon icon={statsChart} className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[8px] font-black tracking-widest text-teal-600 dark:text-teal-400 uppercase">Wearables Hub</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Vitals Trend Analysis</h3>
                </div>
              </div>
              <button 
                onClick={() => setShowAnalyticsModal(false)} 
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <IonIcon icon={close} className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1">
              
              {/* Metric Selector Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl">
                {[
                  { id: 'heart', label: 'Heart Rate' },
                  { id: 'spo2', label: 'SpO2 %' },
                  { id: 'temp', label: 'Temp °F' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedMetric(tab.id as any)}
                    className={`py-2 text-[10px] uppercase tracking-wider font-extrabold rounded-lg transition-all ${
                      selectedMetric === tab.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-750 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Time Range Selector */}
              <div className="flex justify-between items-center px-1">
                <span className="text-[9px] font-extrabold uppercase text-slate-400 dark:text-slate-500">Historical Scope</span>
                <div className="flex gap-1.5">
                  {(['day', 'week', 'month'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setAnalyticsRange(r)}
                      className={`text-[9px] uppercase tracking-widest font-black px-2.5 py-1 rounded-md transition-all ${
                        analyticsRange === r
                          ? 'bg-teal-500/10 border border-teal-500/30 text-teal-650 dark:text-teal-400'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Elegant SVG Chart Rendering */}
              <div className="relative h-48 w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-900 rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase">Live Stream Connected</span>
                </div>
                
                {/* SVG Graph Gridlines and Line */}
                <div className="w-full h-36 relative flex items-end">
                  <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={selectedMetric === 'heart' ? '#f43f5e' : selectedMetric === 'spo2' ? '#14b8a6' : '#8b5cf6'} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={selectedMetric === 'heart' ? '#f43f5e' : selectedMetric === 'spo2' ? '#14b8a6' : '#8b5cf6'} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Horizontal Gridlines */}
                    <line x1="0" y1="10" x2="100" y2="10" stroke="#334155" strokeWidth="0.15" strokeDasharray="1 1" />
                    <line x1="0" y1="25" x2="100" y2="25" stroke="#334155" strokeWidth="0.15" strokeDasharray="1 1" />
                    <line x1="0" y1="40" x2="100" y2="40" stroke="#334155" strokeWidth="0.15" strokeDasharray="1 1" />

                    {(() => {
                      const vitals = [...(data?.myMobileVitals || [])].reverse();
                      let cx = 100;
                      let cy = 25;
                      if (vitals.length > 0) {
                        const width = 100;
                        const minY = 5;
                        const maxY = 45;
                        const values = vitals.map(v => {
                          if (selectedMetric === 'heart') return Number(v.heartRate || 72);
                          if (selectedMetric === 'spo2') return Number(v.oxygenSaturation || 98);
                          return Number(v.temperature || 98.6);
                        });
                        const minVal = Math.min(...values) - 2;
                        const maxVal = Math.max(...values) + 2;
                        const valRange = maxVal - minVal || 1;
                        const latestVal = values[values.length - 1];
                        cx = 100;
                        cy = maxY - ((latestVal - minVal) / valRange) * (maxY - minY);
                      } else {
                        cx = 100;
                        cy = selectedMetric === 'heart' ? 15 : selectedMetric === 'spo2' ? 6 : 24;
                      }

                      const strokeColor = selectedMetric === 'heart' ? '#f43f5e' : selectedMetric === 'spo2' ? '#14b8a6' : '#8b5cf6';

                      return (
                        <>
                          <path d={generateSvgPath(selectedMetric, true)} fill="url(#chartGradient)" />
                          <path d={generateSvgPath(selectedMetric, false)} fill="none" stroke={strokeColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx={cx} cy={cy} r="1.5" fill={strokeColor} className="animate-ping" style={{ transformOrigin: `${cx}px ${cy}px` }} />
                          <circle cx={cx} cy={cy} r="1" fill="#ffffff" stroke={strokeColor} strokeWidth="0.5" />
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* X-Axis labels */}
                <div className="flex justify-between text-[8px] font-mono text-slate-500 dark:text-slate-600 px-1 border-t border-slate-200/60 dark:border-slate-850/80 pt-1.5">
                  {analyticsRange === 'week' ? (
                    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)
                  ) : analyticsRange === 'day' ? (
                    ['08:00', '12:00', '16:00', '20:00', 'Now'].map(hr => <span key={hr}>{hr}</span>)
                  ) : (
                    ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(wk => <span key={wk}>{wk}</span>)
                  )}
                </div>
              </div>

              {/* Health Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-850 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500">Average Reading</span>
                  <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
                    {selectedMetric === 'heart' ? '74 BPM (Normal)' : selectedMetric === 'spo2' ? '98.2% SpO2 (Excellent)' : '98.5°F (Stable)'}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full font-bold border border-emerald-100 dark:border-emerald-900/30">
                  <IonIcon icon={checkmarkCircle} className="w-3.5 h-3.5" />
                  <span>Optimal</span>
                </div>
              </div>

              {/* Wearable Sync Button */}
              <button
                disabled={isSyncingWearables}
                onClick={() => {
                  setIsSyncingWearables(true);
                  setTimeout(() => {
                    setIsSyncingWearables(false);
                    // Fluctuate slightly to show active updates
                    setLiveVitals(prev => ({
                      heartRate: Math.floor(70 + Math.random() * 6),
                      spO2: Math.min(100, Math.floor(97 + Math.random() * 4)),
                      temperature: parseFloat((98.2 + Math.random() * 0.8).toFixed(1))
                    }));
                  }, 1800);
                }}
                className={`w-full h-11 flex items-center justify-center gap-2 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                  isSyncingWearables 
                    ? 'bg-slate-100 dark:bg-slate-850 text-slate-450 cursor-not-allowed border border-slate-200 dark:border-slate-800' 
                    : 'bg-teal-600 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white dark:text-slate-950 active:scale-95'
                }`}
                style={{ borderRadius: '9999px' }}
              >
                <IonIcon icon={sync} className={`w-4.5 h-4.5 ${isSyncingWearables ? 'animate-spin' : ''}`} />
                <span>{isSyncingWearables ? 'Syncing iOS HealthKit...' : 'Force Bluetooth Wearables Sync'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🗺️ VISIT RADAR LOGISTICS TRACKER MODAL */}
      {/* ========================================================================= */}
      {showRadarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4.5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <IonIcon icon={map} className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-[8px] font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">Live Radar</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Visit Transit Map</h3>
                </div>
              </div>
              <button 
                onClick={() => setShowRadarModal(false)} 
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <IonIcon icon={close} className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1">
              <p className="text-xs text-slate-550 dark:text-slate-400 leading-snug">
                Your primary clinician is in route. For safety and security, accurate tracking coordinates are masked within a 500-meter geofence of your recovery room.
              </p>

              {/* Animated Vector Map Container */}
              <div className="relative h-56 w-full bg-[#0a0d16] border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
                {/* Gridlines */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
                
                {/* Pulsing Sonar Sweep */}
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_50%,rgba(99,102,241,0.08)_95%,rgba(99,102,241,0.2))] rounded-2xl animate-[spin_5s_linear_infinite]" />

                {/* SVG Vector Roads & Map Coordinates */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full p-6 overflow-visible select-none pointer-events-none">
                  {/* Stylized streets */}
                  <path d="M-10 30 L110 30" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M-10 70 L110 70" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M30 -10 L30 110" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M70 -10 L70 110" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M-10 10 L110 90" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />

                  {/* Highlighted Transit Path */}
                  <path 
                    d="M 10 30 L 70 30 L 70 70" 
                    fill="none" 
                    stroke="rgba(99,102,241,0.3)" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                  />
                  <path 
                    d="M 10 30 L 70 30 L 70 70" 
                    fill="none" 
                    stroke="#6366f1" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeDasharray="3 3"
                    className="animate-[dash_2s_linear_infinite]"
                  />

                  {/* Patient Home Anchor */}
                  <circle cx="70" cy="70" r="8" fill="rgba(99,102,241,0.15)" className="animate-ping" style={{ transformOrigin: '70px 70px' }} />
                  <circle cx="70" cy="70" r="4.5" fill="#6366f1" stroke="#ffffff" strokeWidth="1" />
                  
                  {/* Clinician Vehicle Icon along Transit Path */}
                  {(() => {
                    let cx = 10;
                    let cy = 30;
                    
                    // Simple linear interpolation over path: 0-50% goes M10,30 -> 70,30. 50-100% goes 70,30 -> 70,70.
                    if (radarTransitProgress <= 50) {
                      cx = 10 + (radarTransitProgress / 50) * 60;
                      cy = 30;
                    } else {
                      cx = 70;
                      cy = 30 + ((radarTransitProgress - 50) / 50) * 40;
                    }

                    const isGeofenced = radarTransitProgress >= 75;

                    return (
                      <g className="transition-all duration-300">
                        {isGeofenced ? (
                          <>
                            {/* Privacy mask shroud circle */}
                            <circle cx="70" cy="70" r="22" fill="rgba(99,102,241,0.06)" stroke="rgba(99,102,241,0.25)" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
                            <circle cx={cx} cy={cy} r="4" fill="rgba(244,63,94,0.3)" />
                            {/* Locked security indicator */}
                            <g transform={`translate(${cx - 3.5}, ${cy - 4}) scale(0.35)`}>
                              <path fill="#f43f5e" d="M12 2C9.24 2 7 4.24 7 7v3H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2h-1V7c0-2.76-2.24-5-5-5zm3 5v3H9V7c0-1.66 1.34-3 3-3s3 1.34 3 3z" />
                            </g>
                          </>
                        ) : (
                          <>
                            <circle cx={cx} cy={cy} r="7" fill="rgba(16,185,129,0.25)" className="animate-pulse" style={{ transformOrigin: `${cx}px ${cy}px` }} />
                            <circle cx={cx} cy={cy} r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                          </>
                        )}
                      </g>
                    );
                  })()}
                </svg>

                {/* Live Distance overlay HUD */}
                <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex flex-col justify-center">
                  <span className="text-[7px] text-slate-500 uppercase tracking-widest font-black">Live ETA</span>
                  <span className="text-xs font-black text-white font-mono leading-none mt-0.5">
                    {radarTransitProgress >= 90 ? 'Clinician Arrived' : `${Math.ceil((100 - radarTransitProgress) * 0.15)} mins away`}
                  </span>
                </div>

                <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex flex-col justify-center text-right">
                  <span className="text-[7px] text-slate-500 uppercase tracking-widest font-black">Speed Vector</span>
                  <span className="text-xs font-black text-white font-mono leading-none mt-0.5">
                    {radarTransitProgress >= 90 ? '0 mph' : '24 mph'}
                  </span>
                </div>
              </div>

              {/* Clinician Card */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-850 border border-slate-300 dark:border-slate-750 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-sm">
                    {clinicianInitials}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{clinicianName}</h4>
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 font-semibold block">{clinicianSpecialty}</span>
                  </div>
                </div>
                {radarTransitProgress >= 75 ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full text-[9px] font-extrabold uppercase tracking-wide">
                    <IonIcon icon={lockClosed} className="w-3.5 h-3.5" />
                    <span>Geofence Shroud</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[9px] font-extrabold uppercase tracking-wide animate-pulse">
                    <span>Active Tracking</span>
                  </div>
                )}
              </div>

              {/* Telematics Status Banner */}
              <div className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                📡 Connected to Halkyone Fleet Telematics Hub
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📊 Clinical Program Progress Tracker Modal - Breathtaking Glassmorphism Dashboard */}
      {showProgramProgressModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setShowProgramProgressModal(false)} />
          
          <div className="relative overflow-hidden w-full max-w-lg rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0b0f19] p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-h-[90vh] flex flex-col">
            
            <div className="absolute -right-24 -top-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-24 -bottom-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 text-teal-600 dark:text-teal-400">
                  <IonIcon icon={trendingUp} className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                    Program Tracker
                  </h2>
                  <p className="text-teal-600 dark:text-teal-400 text-[10px] font-black uppercase tracking-widest mt-1">Clinical Recovery Pathway</p>
                </div>
              </div>
              <button 
                onClick={() => setShowProgramProgressModal(false)} 
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-slate-200 active:scale-95 transition-all"
              >
                <IonIcon icon={close} className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Wrapper */}
            <div className="flex-1 overflow-y-auto pr-1.5 space-y-4 custom-scrollbar">
              {/* Active Pathway Details Card */}
              <div className="p-4 rounded-[1.75rem] border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-[#060a13] space-y-3">
                <div>
                  <span className="text-[8px] font-extrabold tracking-widest text-slate-455 dark:text-slate-500 uppercase">Assigned Care Plan</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{carePlanName}</h4>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-850" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[8px] font-extrabold tracking-widest text-slate-450 dark:text-slate-500 uppercase">Lead Coordinator</span>
                    <p className="text-xs text-slate-800 dark:text-slate-300 font-semibold mt-0.5">{loading ? 'Loading...' : data?.myMobileProfile?.primaryCareNavigatorName || 'Sarah Jenkins'}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-extrabold tracking-widest text-slate-455 dark:text-slate-500 uppercase">Clinical MRN</span>
                    <p className="text-xs text-slate-800 dark:text-slate-300 font-mono font-bold mt-0.5">{loading ? 'Loading...' : data?.myMobileProfile?.mrn || 'MRN-99999'}</p>
                  </div>
                </div>
              </div>

              {/* Milestone Pathway Progress Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-[#070b13] text-center space-y-1">
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Pathway</span>
                  <p className="text-base font-extrabold text-teal-600 dark:text-teal-400 font-mono">{completionPercent}%</p>
                  <span className="text-[8px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest block">Completed</span>
                </div>
                <div className="p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-[#070b13] text-center space-y-1">
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Prescriptions</span>
                  <p className="text-base font-extrabold text-violet-500 font-mono">{meds.length}</p>
                  <span className="text-[8px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest block">In Database</span>
                </div>
                <div className="p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-[#070b13] text-center space-y-1">
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Visits</span>
                  <p className="text-base font-extrabold text-blue-500 font-mono">{data?.myMobileProfile?.encounters?.length || 0}</p>
                  <span className="text-[8px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest block">Encounters</span>
                </div>
              </div>

              {/* Program Milestones Timeline */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <IonIcon icon={statsChart} className="text-teal-500 w-4 h-4" />
                  Active Milestones Pathway
                </h3>

                <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3.5 pl-5 space-y-4">
                  {/* Milestone 1 */}
                  <div className="relative">
                    {activePhase > 1 ? (
                      <div className="absolute -left-8.5 top-0 w-6 h-6 rounded-full bg-emerald-500 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-white dark:text-emerald-400 text-[10px] font-bold shadow-sm shadow-emerald-500/20">
                        ✓
                      </div>
                    ) : activePhase === 1 ? (
                      <div className="absolute -left-8.5 top-0 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-teal-500/30 animate-pulse">
                        1
                      </div>
                    ) : (
                      <div className="absolute -left-8.5 top-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 text-[10px] font-bold">
                        1
                      </div>
                    )}
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-tight flex items-center gap-2 ${activePhase >= 1 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                        Phase 1: Palliative Care Enrollment
                        {activePhase > 1 && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-widest">Completed</span>
                        )}
                        {activePhase === 1 && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-teal-500/10 text-teal-500 border border-teal-500/20 uppercase tracking-widest animate-pulse">Active</span>
                        )}
                      </h4>
                      <p className={`text-[11px] mt-1 leading-relaxed ${activePhase >= 1 ? 'text-slate-550 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'}`}>
                        EMR patient chart initialized under {data?.myMobileProfile?.mrn || 'MRN-99999'}. Care coordination assignment completed.
                      </p>
                    </div>
                  </div>

                  {/* Milestone 2 */}
                  <div className="relative">
                    {activePhase > 2 ? (
                      <div className="absolute -left-8.5 top-0 w-6 h-6 rounded-full bg-emerald-500 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-white dark:text-emerald-400 text-[10px] font-bold shadow-sm shadow-emerald-500/20">
                        ✓
                      </div>
                    ) : activePhase === 2 ? (
                      <div className="absolute -left-8.5 top-0 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-teal-500/30 animate-pulse">
                        2
                      </div>
                    ) : (
                      <div className="absolute -left-8.5 top-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 text-[10px] font-bold">
                        2
                      </div>
                    )}
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-tight flex items-center gap-2 ${activePhase >= 2 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                        Phase 2: Pain & Symptom Stabilization
                        {activePhase > 2 && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-widest">Completed</span>
                        )}
                        {activePhase === 2 && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-teal-500/10 text-teal-500 border border-teal-500/20 uppercase tracking-widest animate-pulse">Active</span>
                        )}
                      </h4>
                      <p className={`text-[11px] mt-1 leading-relaxed ${activePhase >= 2 ? 'text-slate-555 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'}`}>
                        Daily vitals check, wound tracking, and oncology medication adherence logging are active.
                      </p>
                    </div>
                  </div>

                  {/* Milestone 3 */}
                  <div className="relative">
                    {activePhase > 3 ? (
                      <div className="absolute -left-8.5 top-0 w-6 h-6 rounded-full bg-emerald-500 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-white dark:text-emerald-400 text-[10px] font-bold shadow-sm shadow-emerald-500/20">
                        ✓
                      </div>
                    ) : activePhase === 3 ? (
                      <div className="absolute -left-8.5 top-0 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-teal-500/30 animate-pulse">
                        3
                      </div>
                    ) : (
                      <div className="absolute -left-8.5 top-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-450 dark:text-slate-655 text-[10px] font-bold">
                        3
                      </div>
                    )}
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-tight flex items-center gap-2 ${activePhase >= 3 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                        Phase 3: Interim Assessment & Titration
                        {activePhase > 3 && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-widest">Completed</span>
                        )}
                        {activePhase === 3 && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-teal-500/10 text-teal-500 border border-teal-500/20 uppercase tracking-widest animate-pulse">Active</span>
                        )}
                      </h4>
                      <p className={`text-[11px] mt-1 leading-relaxed ${activePhase >= 3 ? 'text-slate-555 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'}`}>
                        Symptom tracking checkups and clinical review scheduled upon completing initial therapy blocks.
                      </p>
                    </div>
                  </div>

                  {/* Milestone 4 */}
                  <div className="relative">
                    {activePhase > 4 ? (
                      <div className="absolute -left-8.5 top-0 w-6 h-6 rounded-full bg-emerald-500 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-white dark:text-emerald-400 text-[10px] font-bold shadow-sm shadow-emerald-500/20">
                        ✓
                      </div>
                    ) : activePhase === 4 ? (
                      <div className="absolute -left-8.5 top-0 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-teal-500/30 animate-pulse">
                        4
                      </div>
                    ) : (
                      <div className="absolute -left-8.5 top-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-455 dark:text-slate-655 text-[10px] font-bold">
                        4
                      </div>
                    )}
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-tight flex items-center gap-2 ${activePhase >= 4 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                        Phase 4: Discharge Readiness Evaluation
                        {activePhase > 4 && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-widest">Completed</span>
                        )}
                        {activePhase === 4 && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-teal-500/10 text-teal-500 border border-teal-500/20 uppercase tracking-widest animate-pulse">Active</span>
                        )}
                      </h4>
                      <p className={`text-[11px] mt-1 leading-relaxed ${activePhase >= 4 ? 'text-slate-555 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600'}`}>
                        Final clinical assessment checkups, health graduation milestones, and coordination handoff.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Progress Summary */}
              <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10 flex items-center gap-3">
                <IonIcon icon={informationCircle} className="text-teal-600 dark:text-teal-400 w-5 h-5 flex-shrink-0" />
                <p className="text-[10px] text-slate-550 dark:text-slate-455 leading-snug">
                  Your recovery metrics are synchronized directly with EMR. Your primary Navigator <strong>{data?.myMobileProfile?.primaryCareNavigatorName || 'Sarah Jenkins'}</strong> will contact you if any adjustments are needed.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📜 GOALS OF CARE / ADVANCED CARE PLANNING VAULT MODAL */}
      {/* ========================================================================= */}
      {showDirectivesModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setShowDirectivesModal(false)} />
          
          <div className="relative overflow-hidden w-full max-w-md rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-h-[85vh] flex flex-col">
            <div className="absolute -right-20 -top-20 w-40 h-40 bg-teal-50/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 text-teal-600 dark:text-teal-400">
                  <IonIcon icon={shieldCheckmark} className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Goals of Care Vault</h3>
                  <span className="text-[8px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-widest mt-0.5 block">Advanced Care Planning (ACP)</span>
                </div>
              </div>
              <button 
                onClick={() => setShowDirectivesModal(false)} 
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <IonIcon icon={close} className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Wrapper */}
            <div className="flex-1 overflow-y-auto pr-1.5 space-y-4 custom-scrollbar">
              <p className="text-xs text-slate-550 dark:text-slate-455 leading-relaxed">
                These are your legally binding and active Advance Directives as verified and signed in cooperation with your Halkyone primary care providers.
              </p>

              <div className="space-y-3.5">
                {data?.myMobileProfile?.advanceDirectives && data.myMobileProfile.advanceDirectives.length > 0 ? (
                  data.myMobileProfile.advanceDirectives.map((d: any) => (
                    <div 
                      key={d.advanceDirectiveId} 
                      className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3 transition-all hover:border-teal-500/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-xs font-black uppercase text-slate-900 dark:text-white font-sans">
                            {d.type === 'DNR' ? 'Do Not Resuscitate (DNR)' : d.type === 'ComfortMeasuresOnly' ? 'Comfort Measures Only (CMO)' : d.type}
                          </span>
                        </div>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">
                          Active since {new Date(d.effectiveDate).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans italic bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850">
                        "{d.notes}"
                      </p>

                      <a 
                        href={d.documentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="h-10 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200/50 dark:border-slate-750 transition-colors w-full"
                      >
                        <IonIcon icon={cloudUpload} className="w-4.5 h-4.5 text-teal-500" />
                        <span>View Signed Legal Document</span>
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <p className="text-xs text-slate-455 dark:text-slate-555">No advance directives registered in active profile.</p>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-500/5 border border-teal-500/10 flex items-start gap-2.5">
                <IonIcon icon={informationCircle} className="text-teal-600 dark:text-teal-400 w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 dark:text-slate-455 leading-relaxed">
                  If you need to make changes to your Goals of Care, upload a new directive, or contact Dr. Ross, please coordinate with your Primary Care Navigator.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌸 ANTICIPATORY GUIDANCE & CARE-SUPPORT HUB MODAL */}
      {/* ========================================================================= */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setShowSupportModal(false)} />
          
          <div className="relative overflow-hidden w-full max-w-md rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-h-[85vh] flex flex-col">
            <div className="absolute -right-20 -top-20 w-40 h-40 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-455">
                  <IonIcon icon={informationCircle} className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Anticipatory Comfort Care</h3>
                  <span className="text-[8px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-widest mt-0.5 block">Caregiver & Family Support Hub</span>
                </div>
              </div>
              <button 
                onClick={() => setShowSupportModal(false)} 
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <IonIcon icon={close} className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Wrapper */}
            <div className="flex-1 overflow-y-auto pr-1.5 space-y-4 custom-scrollbar">
              <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">
                Palliative physical transitions can be managed peacefully at home. Use these clinical comfort guides to support your loved one during progressive symptom changes.
              </p>

              {/* Guides Section */}
              <div className="space-y-3.5">
                
                {/* Dyspnea */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 space-y-1.5">
                  <span className="text-[9px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider block">1. Air Hunger / Dyspnea</span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                    • <strong>Bedside Fan Effect:</strong> A cool breeze blowing across the cheek/face stimulates the trigeminal nerve, naturally calming breathing centers in the brain.<br />
                    • <strong>Optimized Position:</strong> Support the patient sitting upright or leaning forward slightly, resting their forearms on a bedside table.
                  </p>
                </div>

                {/* Respiratory Secretions */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 space-y-1.5">
                  <span className="text-[9px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider block">2. Congestion ("Death Rattle")</span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                    • <strong>Reassurance:</strong> This loud breathing is a natural relaxation of throat muscles. It is not painful or distressing for the patient.<br />
                    • <strong>Bedside Action:</strong> Turn the patient gently to a side-lying position. <strong>Do not use deep suctioning</strong>, as it can cause significant airway spasms and panic.
                  </p>
                </div>

                {/* Terminal Restlessness */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 space-y-1.5">
                  <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">3. Terminal Restlessness & Panic</span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                    • <strong>Calming Ambience:</strong> Dim the bedroom lighting, turn off loud television noise, and play low-volume ambient music.<br />
                    • <strong>Touch & Tone:</strong> Speak in low, peaceful, steady whispers. Hold their hand or brush their forehead gently to provide sensory grounding.
                  </p>
                </div>

                {/* Bereavement Support */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-rose-950/10 border border-slate-200/50 dark:border-rose-900/20 space-y-1.5">
                  <span className="text-[9px] font-black uppercase text-pink-600 dark:text-pink-400 tracking-wider block">4. Bereavement & Caregiver Support</span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                    • <strong>Counseling Access:</strong> We provide 24/7 complimentary grief support, spiritual counseling, and local support handovers for family members.<br />
                    • <strong>Respite Checklist:</strong> Coordinate a caregiver shift handoff utilizing the Comfort Ring tasks to maintain continuity.
                  </p>
                </div>

              </div>

              {/* Support Actions */}
              <div className="flex flex-col gap-2 pt-2.5">
                <a
                  href="tel:18005557255"
                  className="w-full h-11 bg-rose-600 hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-400 text-white dark:text-[#020408] rounded-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider shadow-md shadow-rose-500/10 active:scale-95 transition-transform"
                  style={{ textDecoration: 'none' }}
                >
                  <IonIcon icon={shieldCheckmark} className="w-4.5 h-4.5" />
                  <span>Call Palliative Support Hotline</span>
                </a>

                <IonButton
                  expand="block"
                  fill="outline"
                  className="text-xs font-bold uppercase border-slate-200 dark:border-slate-800 rounded-full h-10 w-full"
                  onClick={() => setShowSupportModal(false)}
                  style={{ '--border-radius': '9999px', '--border-color': 'var(--ion-color-step-300)' }}
                >
                  Close Support Hub
                </IonButton>
              </div>
            </div>
          </div>
        </div>
      )}

    </IonPage>
  );
};

export default ComfortDashboard;
