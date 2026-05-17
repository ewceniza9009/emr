import React, { useState, useRef, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonIcon,
  IonRippleEffect,
  IonModal,
  IonButton,
  IonToolbar
} from '@ionic/react';
import {
  send,
  camera,
  attach,
  shieldCheckmark,
  warning,
  heart,
  checkmarkDone,
  sunny,
  moon as moonIcon
} from 'ionicons/icons';
import { useTheme } from '../contexts/ThemeContext';

interface Message {
  id: string;
  sender: 'patient' | 'navigator';
  content: string;
  timestamp: string;
  isAttachment?: boolean;
}

const CareHub: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'navigator',
      content: 'Hello! I am Sarah, your Care Navigator. How are you feeling today following your procedure?',
      timestamp: '09:30 AM'
    },
    {
      id: '2',
      sender: 'patient',
      content: 'Hi Sarah, the recovery is going pretty well. The pain has decreased since yesterday morning.',
      timestamp: '09:32 AM'
    },
    {
      id: '3',
      sender: 'navigator',
      content: 'That is wonderful news! Keep monitoring your daily checklist. Have you taken a look at your wound site today? If possible, please send a secure photo using the camera button so we can log it.',
      timestamp: '09:35 AM'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosReason, setSosReason] = useState('');
  const [navigatorTyping, setNavigatorTyping] = useState(false);

  const contentRef = useRef<HTMLIonContentElement>(null);

  const scrollToBottom = () => {
    if (contentRef.current) {
      setTimeout(() => {
        contentRef.current?.scrollToBottom(300);
      }, 100);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, navigatorTyping]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const trimmedText = inputText.trim();
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'patient',
      content: trimmedText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Trigger NLP emergency check
    const lowerText = trimmedText.toLowerCase();
    if (lowerText.includes('chest pain') || lowerText.includes('heart attack') || lowerText.includes('cannot breathe') || lowerText.includes('shortness of breath')) {
      setSosReason('Chest Pain / Dyspnea');
      setShowSosModal(true);
      
      // Simulate navigator alert response
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'navigator',
            content: '⚠️ WARNING: High-Priority Emergency Protocol Activated. Our system detected distress symptoms. A clinical override has been triggered on the Care Team dashboard. An oncologist is reviewing your telemetry right now.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 1500);
      return;
    }

    // Simulate regular care navigator response
    setNavigatorTyping(true);
    setTimeout(() => {
      setNavigatorTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          sender: 'navigator',
          content: 'Thank you for updating me. I have logged this update in your recovery timeline. Let me know if you experience any other symptoms or need a prescription refill!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 2500);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleWoundCamera = () => {
    // Mock taking secure photo
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'patient',
      content: '📸 Secure Wound Photo sent (Encrypted & Masked)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAttachment: true
    };
    setMessages(prev => [...prev, newMsg]);
    
    setNavigatorTyping(true);
    setTimeout(() => {
      setNavigatorTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          sender: 'navigator',
          content: 'Excellent, photo received. The wound margins look healthy and healing properly. No signs of infection. Keep keeping it clean!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 2000);
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
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-sm">
                  SJ
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#020408] shadow-[0_0_6px_#10b981]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-black text-slate-900 dark:text-white leading-tight">Sarah Jenkins</h2>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/50 rounded-md text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    HIPAA Secure
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium block">Primary Care Navigator</span>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 transition-colors"
              title={theme === 'dark' ? 'Switch to Porcelain Mode' : 'Switch to Midnight Mode'}
            >
              <IonIcon icon={theme === 'dark' ? sunny : moonIcon} className="w-4 h-4" />
            </button>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent ref={contentRef} className="ion-padding">
        <div className="flex flex-col min-h-full space-y-4 pb-4">
          
          {/* Emergency Helper Tip */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 dark:from-amber-950/20 dark:to-slate-900/40 border border-amber-200/60 dark:border-amber-900/40 flex gap-2.5">
            <IonIcon icon={warning} className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 animate-pulse" />
            <div>
              <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-500 uppercase tracking-wider block">NLP Distress Trigger Test</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                Type <strong className="text-slate-700 dark:text-white">"chest pain"</strong> or <strong className="text-slate-700 dark:text-white">"cannot breathe"</strong> to simulate the automatic clinical dashboard triage override!
              </p>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-grow space-y-4">
            {messages.map((msg) => {
              const isPatient = msg.sender === 'patient';
              return (
                <div key={msg.id} className={`flex ${isPatient ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] p-3 rounded-2xl ${
                    isPatient
                      ? msg.isAttachment
                        ? 'bg-slate-100 dark:bg-gradient-to-br dark:from-teal-950/40 dark:to-slate-950 border border-slate-200 dark:border-teal-900/50 text-slate-800 dark:text-teal-300 rounded-tr-none'
                        : 'bg-teal-600 dark:bg-gradient-to-br dark:from-teal-500 dark:to-teal-650 text-white dark:text-slate-950 font-medium rounded-tr-none shadow-[0_2px_8px_rgba(13,148,136,0.1)] dark:shadow-[0_4px_12px_rgba(20,184,166,0.15)]'
                      : msg.content.startsWith('⚠️')
                      ? 'bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 rounded-tl-none'
                      : 'bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-[0_2px_8px_rgba(15,23,42,0.02)]'
                  }`}>
                    {msg.isAttachment && (
                      <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-slate-200/50 dark:bg-teal-950/50 border border-slate-300 dark:border-teal-900/50">
                        <IonIcon icon={shieldCheckmark} className="w-4 h-4 text-slate-700 dark:text-teal-400" />
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-700 dark:text-teal-400">Media Shield Active</span>
                      </div>
                    )}
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 text-[8px] ${
                      isPatient ? msg.isAttachment ? 'text-slate-400 dark:text-slate-500' : 'text-teal-100 dark:text-slate-500' : 'text-slate-400 dark:text-slate-500'
                    } font-mono`}>
                      <span>{msg.timestamp}</span>
                      {isPatient && <IonIcon icon={checkmarkDone} className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Navigator Typing Indicator */}
            {navigatorTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 p-3 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-550 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-550 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-550 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

        </div>
      </IonContent>

      {/* Input bar */}
      <div className="p-3 bg-slate-50 dark:bg-[#020408] border-t border-slate-200 dark:border-slate-900">
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <button
            onClick={handleWoundCamera}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full active:bg-slate-100 dark:active:bg-slate-850 flex-shrink-0"
            title="Take Secure Photo"
            style={{ borderRadius: '9999px' }}
          >
            <IonIcon icon={camera} className="w-5 h-5" />
          </button>
          
          <button
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full active:bg-slate-100 dark:active:bg-slate-850 flex-shrink-0"
            title="Attach Document"
            style={{ borderRadius: '9999px' }}
          >
            <IonIcon icon={attach} className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your secure message..."
            className="flex-grow bg-transparent border-0 outline-none text-xs text-slate-800 dark:text-white placeholder-slate-450 dark:placeholder-slate-500 py-1.5 px-1"
          />

          <button
            onClick={handleSendMessage}
            className="p-2.5 bg-teal-600 dark:bg-gradient-to-r dark:from-teal-500 dark:to-emerald-500 text-white dark:text-slate-950 rounded-full active:opacity-90 flex-shrink-0 shadow-md"
            style={{ borderRadius: '9999px' }}
          >
            <IonIcon icon={send} className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SOS Alert Modal */}
      <IonModal isOpen={showSosModal} onDidDismiss={() => setShowSosModal(false)} className="sos-modal">
        <div className="p-6 bg-white dark:bg-[#090b10] border border-rose-200 dark:border-rose-900/50 rounded-2xl text-center space-y-5 h-full flex flex-col justify-center items-center">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center animate-ping">
            <IonIcon icon={heart} className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Emergency Warning</h2>
            <div className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-full inline-block text-[10px] font-mono text-rose-600 dark:text-rose-400 uppercase tracking-widest">
              Symptom Detected: {sosReason}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mt-2">
              Our clinical NLP core has identified symptoms indicative of cardiac or respiratory distress. A high-priority dashboard override was sent to the Halkyone Clinical Command Center.
            </p>
          </div>

          <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-left">
            <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-wider">Patient Directions</span>
            <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-snug mt-1">
              • Lie down in a comfortable position.<br />
              • If prescribed nitroglycerin, administer as directed.<br />
              • <strong className="text-slate-950 dark:text-white">Call 911 immediately</strong> if your pain worsens or you lose consciousness.
            </p>
          </div>

          <div className="flex gap-3 w-full">
            <IonButton
              expand="block"
              color="danger"
              className="flex-grow text-xs font-black uppercase"
              onClick={() => setShowSosModal(false)}
            >
              Acknowledge Alert
            </IonButton>
          </div>
        </div>
      </IonModal>
    </IonPage>
  );
};

export default CareHub;
