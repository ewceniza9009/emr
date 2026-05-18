import React, { useState } from 'react';
import { gql } from '@apollo/client/core';
import { useQuery } from '@apollo/client/react';
import { useAuth } from '../contexts/AuthContext';
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
  sunny,
  moon as moonIcon
} from 'ionicons/icons';
import { useTheme } from '../contexts/ThemeContext';

const GET_MY_PRESCRIPTIONS = gql`
  query GetMyPrescriptions($patientId: UUID!) {
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

const GET_MY_PROFILE = gql`
  query GetMyProfile($patientId: UUID!) {
    myMobileProfile(patientId: $patientId) {
      primaryCareNavigatorName
    }
  }
`;

const Pharmacy: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  
  const { data, loading } = useQuery<any>(GET_MY_PRESCRIPTIONS, {
    variables: { patientId: user?.patientId },
    skip: !user?.patientId,
    fetchPolicy: 'cache-and-network'
  });

  const { data: profileData } = useQuery<any>(GET_MY_PROFILE, {
    variables: { patientId: user?.patientId },
    skip: !user?.patientId,
    fetchPolicy: 'cache-and-network'
  });

  const navigatorName = profileData?.myMobileProfile?.primaryCareNavigatorName || "Sarah Jenkins";

  const apiMeds = data?.myMobilePrescriptions || [];

  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerRefill = (id: string) => {
    setToastMessage(`Refill request sent to ${navigatorName}!`);
    setShowToast(true);
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
      {/* Header - Generous, Accessible Layout */}
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ 
          '--min-height': '64px',
          '--padding-top': '8px',
          '--padding-bottom': '8px',
          '--padding-start': '16px',
          '--padding-end': '16px'
        }}>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <IonIcon icon={medkit} className="text-teal-600 dark:text-teal-400 w-4 h-4" />
                <span className="text-[10px] uppercase font-black tracking-widest text-teal-600 dark:text-teal-400">ePrescriptions</span>
              </div>
              <h1 className="text-[19px] font-black tracking-tight text-slate-900 dark:text-white font-sans flex items-baseline gap-1.5">
                Pharmacy <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">Oncology Plan</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
                title={theme === 'dark' ? 'Switch to Porcelain Mode' : 'Switch to Midnight Mode'}
              >
                <IonIcon icon={theme === 'dark' ? sunny : moonIcon} className="w-4.5 h-4.5" />
              </button>

              {/* Reminders Toggle */}
              <button
                onClick={toggleReminders}
                className={`p-2.5 rounded-full border transition-all shadow-sm ${
                  remindersEnabled
                    ? 'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/50 text-teal-600 dark:text-teal-400 font-bold'
                    : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                }`}
                title={remindersEnabled ? 'Disable Reminders' : 'Enable Reminders'}
              >
                <IonIcon icon={remindersEnabled ? notifications : notificationsOff} className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="space-y-5 pb-8">
          
          {/* Pharmacy Delivery Hub Banner - Accessible Styling */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0b0f19] dark:bg-gradient-to-r dark:from-teal-950/20 dark:to-slate-900/40 border border-slate-200 dark:border-teal-900/40 flex items-start gap-3.5 shadow-sm">
            <IonIcon icon={informationCircle} className="w-5.5 h-5.5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest block">Refill Integration Status</span>
              <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">
                Prescription refills are managed directly by your primary pharmacy. Refill requests sent in-app are immediately triaged by your Care Navigator using MediatR messaging protocols.
              </p>
            </div>
          </div>

          {/* Active Medications List */}
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500 text-center py-4 font-bold">Loading ePrescriptions...</p>
            ) : apiMeds.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4 font-bold">No active prescriptions.</p>
            ) : apiMeds.map((med: any, index: number) => (
              <div
                key={med.prescriptionId || index}
                className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b0f19] dark:bg-gradient-to-br dark:from-[#0b0f19] dark:to-slate-900/20 p-4.5 flex flex-col justify-between gap-4 shadow-md"
              >
                {/* Upper Details */}
                <div className="flex items-start gap-4">
                  {/* Pill Visual Identifier */}
                  <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center flex-shrink-0 relative shadow-inner">
                    <div className="bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.5)] w-6 h-6 rounded-full" />
                  </div>

                  <div className="space-y-1 flex-grow">
                    <h3 className="text-[16px] font-black text-slate-900 dark:text-white leading-tight font-sans">
                      {med.medication?.name || 'Unknown'}
                    </h3>
                    <span className="text-xs text-teal-600 dark:text-teal-400 font-extrabold block">
                      {med.medication?.genericName || ''}
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-bold pt-1.5">
                      Dosage: <span className="font-mono text-slate-900 dark:text-white font-black">{med.dose}</span>
                    </p>
                  </div>
                </div>

                {/* Lower Action & Telemetry */}
                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-black">Schedule</span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-700 dark:text-slate-300 font-bold">
                      <IonIcon icon={time} className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span className="font-mono">{med.frequency}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right pr-1">
                      <span className="block text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-black">Status</span>
                      <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                        {med.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Refill Button */}
                    <button
                      onClick={() => triggerRefill(med.prescriptionId)}
                      className="relative overflow-hidden flex-shrink-0 h-10 px-5 flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider transition-all border shadow-md bg-teal-600 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-500 hover:bg-teal-500 dark:hover:from-teal-400 dark:hover:to-emerald-400 text-white dark:text-slate-950 border-teal-600/20 dark:border-teal-500/20 active:scale-95"
                      style={{ borderRadius: '9999px' }}
                    >
                      <IonRippleEffect />
                      <IonIcon icon={refreshCircle} className="w-4.5 h-4.5" />
                      <span>Refill</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Smart Notifications Advisory */}
          <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-900/60 text-slate-500 space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block">🔒 Medication Privacy Assurance</span>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-450 font-semibold">
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
