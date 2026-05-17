import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonIcon,
  IonToast,
  IonRippleEffect,
  IonToolbar
} from '@ionic/react';
import {
  medkit,
  time,
  refreshCircle,
  notifications,
  notificationsOff,
  informationCircle,
  checkmarkCircle,
  sunny,
  moon as moonIcon
} from 'ionicons/icons';
import { useTheme } from '../contexts/ThemeContext';

interface Medication {
  id: string;
  name: string;
  generic: string;
  dosage: string;
  schedule: string;
  refillsLeft: number;
  pillColor: string;
  pillShape: 'capsule' | 'round' | 'oval';
  refillStatus: 'idle' | 'pending' | 'approved';
}

const Pharmacy: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [meds, setMeds] = useState<Medication[]>([
    {
      id: '1',
      name: 'Osimertinib (Tagrisso)',
      generic: 'Targeted EGFR Therapy',
      dosage: '80mg • 1 tablet daily',
      schedule: 'Every morning at 8:00 AM',
      refillsLeft: 2,
      pillColor: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
      pillShape: 'round',
      refillStatus: 'idle'
    },
    {
      id: '2',
      name: 'Ondansetron (Zofran)',
      generic: 'Antiemetic',
      dosage: '4mg • As needed for nausea',
      schedule: 'Every 8 hours as needed',
      refillsLeft: 1,
      pillColor: 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.4)]',
      pillShape: 'oval',
      refillStatus: 'idle'
    },
    {
      id: '3',
      name: 'Dexamethasone',
      generic: 'Corticosteroid',
      dosage: '2mg • 1 tablet daily',
      schedule: 'Take with lunch at 12:00 PM',
      refillsLeft: 0,
      pillColor: 'bg-slate-350 dark:bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)]',
      pillShape: 'capsule',
      refillStatus: 'idle'
    }
  ]);

  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerRefill = (id: string) => {
    setMeds(meds.map(m => {
      if (m.id === id) {
        if (m.refillStatus !== 'idle') return m;
        
        // Success notification message
        setToastMessage(`Refill request for ${m.name} sent to Sarah Jenkins!`);
        setShowToast(true);
        return { ...m, refillStatus: 'pending' };
      }
      return m;
    }));

    // Simulate clinical approval after 6 seconds
    setTimeout(() => {
      setMeds(prev => prev.map(m => {
        if (m.id === id) {
          setToastMessage(`🎉 Care Navigator approved refill for ${m.name}! Copay pending.`);
          setShowToast(true);
          return { ...m, refillStatus: 'approved', refillsLeft: m.refillsLeft > 0 ? m.refillsLeft - 1 : 0 };
        }
        return m;
      }));
    }, 6000);
  };

  const toggleReminders = () => {
    setRemindersEnabled(!remindersEnabled);
    setToastMessage(
      !remindersEnabled
        ? '🔔 Smart Pill Reminders activated. Local push notifications enabled.'
        : '🔕 Pill reminders disabled.'
    );
    setShowToast(true);
  };

  return (
    <IonPage className="bg-slate-50 dark:bg-[#020408]">
      {/* Header - Compact Single Row */}
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
                <IonIcon icon={medkit} className="text-teal-600 dark:text-teal-400 w-3.5 h-3.5" />
                <span className="text-[9px] uppercase font-black tracking-widest text-teal-600 dark:text-teal-400">ePrescriptions</span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white font-sans flex items-baseline gap-1.5">
                Pharmacy <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Oncology Plan</span>
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

              {/* Reminders Toggle */}
              <button
                onClick={toggleReminders}
                className={`p-2 rounded-full border transition-all ${
                  remindersEnabled
                    ? 'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/50 text-teal-600 dark:text-teal-400 font-bold'
                    : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                }`}
                title={remindersEnabled ? 'Disable Reminders' : 'Enable Reminders'}
              >
                <IonIcon icon={remindersEnabled ? notifications : notificationsOff} className="w-4 h-4" />
              </button>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="space-y-5 pb-8">
          
          {/* Pharmacy Delivery Hub Banner - Responsive colors */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0b0f19] dark:bg-gradient-to-r dark:from-teal-950/20 dark:to-slate-900/40 border border-slate-200 dark:border-teal-900/40 flex items-start gap-3 shadow-[0_2px_8px_rgba(15,23,42,0.015)]">
            <IonIcon icon={informationCircle} className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[9px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">Refill Integration Status</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                Prescription refills are managed directly by your primary pharmacy. Refill requests sent in-app are immediately triaged by your Care Navigator using MediatR messaging protocols.
              </p>
            </div>
          </div>

          {/* Active Medications List */}
          <div className="space-y-4">
            {meds.map((med) => (
              <div
                key={med.id}
                className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 p-4 flex flex-col justify-between gap-4 shadow-[0_4px_20px_rgba(15,23,42,0.02)]"
              >
                {/* Upper Details */}
                <div className="flex items-start gap-4">
                  {/* Pill Visual Identifier */}
                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 flex items-center justify-center flex-shrink-0 relative">
                    <div className={`${med.pillColor} ${
                      med.pillShape === 'capsule'
                        ? 'w-7 h-3 rounded-full transform -rotate-45'
                        : med.pillShape === 'oval'
                        ? 'w-6 h-4 rounded-[40%]'
                        : 'w-5 h-5 rounded-full'
                    }`} />
                  </div>

                  <div className="space-y-1 flex-grow">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{med.name}</h3>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold block">{med.generic}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-350 font-medium pt-1 flex items-center gap-1.5">
                      <span className="font-sans">{med.dosage}</span>
                    </p>
                  </div>
                </div>

                {/* Lower Action & Telemetry */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-900/60 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Schedule</span>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                      <IonIcon icon={time} className="w-3.5 h-3.5 text-slate-300 dark:text-slate-650" />
                      <span className="font-mono">{med.schedule}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right pr-1">
                      <span className="block text-[8px] uppercase text-slate-400 dark:text-slate-500 font-bold">Refills</span>
                      <span className={`text-[10px] font-bold font-mono ${
                        med.refillsLeft === 0 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'
                      }`}>
                        {med.refillsLeft} remaining
                      </span>
                    </div>

                    {/* Refill Button */}
                    <button
                      onClick={() => triggerRefill(med.id)}
                      disabled={med.refillStatus !== 'idle'}
                      className={`relative overflow-hidden flex-shrink-0 h-8 px-4 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all border shadow-sm ${
                        med.refillStatus === 'pending'
                          ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400'
                          : med.refillStatus === 'approved'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold'
                          : med.refillsLeft === 0 && med.refillStatus === 'idle'
                          ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-500 cursor-not-allowed'
                          : 'bg-teal-600 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-500 hover:bg-teal-500 dark:hover:from-teal-400 dark:hover:to-emerald-400 text-white dark:text-slate-950 border-teal-600/20 dark:border-teal-500/20'
                      }`}
                      style={{ borderRadius: '9999px' }}
                    >
                      <IonRippleEffect />
                      {med.refillStatus === 'pending' ? (
                        <>
                          <IonIcon icon={refreshCircle} className="w-3.5 h-3.5 animate-spin" />
                          <span>Requesting</span>
                        </>
                      ) : med.refillStatus === 'approved' ? (
                        <>
                          <IonIcon icon={checkmarkCircle} className="w-3.5 h-3.5" />
                          <span>Approved</span>
                        </>
                      ) : (
                        <>
                          <IonIcon icon={refreshCircle} className="w-3.5 h-3.5" />
                          <span>Refill</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Smart Notifications Advisory */}
          <div className="p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-900/60 text-slate-500 space-y-1.5">
            <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">🔒 Medication Privacy Assurance</span>
            <p className="text-[9px] leading-snug">
              Local notifications display generic medication alerts (e.g. "Time for your Scheduled Care Dose") to preserve patient health status privacy in public environments, matching clinical best practices.
            </p>
          </div>

        </div>
      </IonContent>

      {/* Toast Notification */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={4000}
        color={theme === 'dark' ? 'dark' : 'primary'}
      />
    </IonPage>
  );
};

export default Pharmacy;
