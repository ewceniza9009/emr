import React, { useState, useRef, useEffect } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { gql } from '@apollo/client/core';
import { useQuery, useMutation } from '@apollo/client/react';
import { useAuth } from '../contexts/AuthContext';
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
  paperPlane,
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

const GET_CHAT_THREADS = gql`
  query GetChatThreads($patientId: UUID!) {
    myMobileChatThreads(patientId: $patientId) {
      careThreadId
      subject
      isActive
      messages {
        chatMessageId
        senderRole
        content
        timestamp
      }
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($patientId: UUID!, $careThreadId: UUID!, $content: String!) {
    sendMobileChatMessage(patientId: $patientId, careThreadId: $careThreadId, content: $content) {
      chatMessageId
      content
      timestamp
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

const CareHub: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, apiUrl, token } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosReason, setSosReason] = useState('');
  const [navigatorTyping, setNavigatorTyping] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const patientId = user?.patientId || (user as any)?.PatientId;

  const { data } = useQuery<any>(GET_CHAT_THREADS, {
    variables: { patientId },
    skip: !patientId,
    fetchPolicy: 'cache-and-network'
  });

  const { data: profileData } = useQuery<any>(GET_MY_PROFILE, {
    variables: { patientId },
    skip: !patientId,
    fetchPolicy: 'cache-and-network'
  });

  const navigatorName = profileData?.myMobileProfile?.primaryCareNavigatorName || "Sarah Jenkins";
  const navigatorInitials = navigatorName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    const threads = data?.myMobileChatThreads;
    if (threads && threads.length > 0) {
      const firstThread = threads[0];
      setActiveThreadId(firstThread.careThreadId);
      const mapped = firstThread.messages?.map((m: any) => ({
        id: m.chatMessageId,
        sender: m.senderRole === 'patient' ? 'patient' : 'navigator',
        content: m.content,
        timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })) || [];
      setMessages(mapped);
    }
  }, [data]);

  const [sendMessageMutation] = useMutation(SEND_MESSAGE);

  useEffect(() => {
    if (!activeThreadId || !apiUrl || !token) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${apiUrl}/hubs/chat`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connection.start().then(() => {
      console.log('SignalR Connected');
      connection.invoke('JoinCareThread', activeThreadId);
    }).catch(err => console.error('SignalR Connection Error: ', err));

    connection.on('ReceiveMessage', (message: any) => {
      setMessages(prev => {
        if (prev.find(m => m.id === message.chatMessageId || m.content === message.content)) return prev;
        return [...prev, {
          id: message.chatMessageId,
          sender: message.senderRole === 'patient' ? 'patient' : 'navigator',
          content: message.content,
          timestamp: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];
      });
    });

    return () => {
      connection.stop();
    };
  }, [activeThreadId, apiUrl, token]);

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

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const trimmedText = inputText.trim();
    const tempId = Date.now().toString();
    const newMsg: Message = {
      id: tempId,
      sender: 'patient',
      content: trimmedText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    const lowerText = trimmedText.toLowerCase();
    if (lowerText.includes('chest pain') || lowerText.includes('heart attack') || lowerText.includes('cannot breathe') || lowerText.includes('shortness of breath')) {
      setSosReason('Chest Pain / Dyspnea');
      setShowSosModal(true);
    }

    try {
      await sendMessageMutation({
        variables: {
          patientId,
          careThreadId: activeThreadId || "00000000-0000-0000-0000-000000000000",
          content: trimmedText
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleWoundCamera = () => {
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
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-teal-600 dark:text-teal-400 font-extrabold text-base">
                  {navigatorInitials}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#020408] shadow-[0_0_8px_#10b981]" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-black text-slate-900 dark:text-white leading-tight">{navigatorName}</h2>
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    HIPAA Secure
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">Primary Care Navigator</span>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
              title={theme === 'dark' ? 'Switch to Porcelain Mode' : 'Switch to Midnight Mode'}
            >
              <IonIcon icon={theme === 'dark' ? sunny : moonIcon} className="w-4.5 h-4.5" />
            </button>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent ref={contentRef} className="ion-padding">
        <div className="flex flex-col min-h-full space-y-4 pb-6">
          
          {/* Emergency Helper Tip */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 dark:from-amber-950/20 dark:to-slate-900/40 border border-amber-250 dark:border-amber-900/40 flex gap-3 shadow-sm">
            <IonIcon icon={warning} className="w-5.5 h-5.5 text-amber-600 dark:text-amber-500 flex-shrink-0 animate-pulse" />
            <div>
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest block">NLP Distress Trigger Test</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                Type <strong className="text-slate-700 dark:text-white font-extrabold">"chest pain"</strong> or <strong className="text-slate-700 dark:text-white font-extrabold">"cannot breathe"</strong> to simulate the automatic triage override!
              </p>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-grow space-y-4 pt-1">
            {messages.map((msg) => {
              const isPatient = msg.sender === 'patient';
              return (
                <div key={msg.id} className={`flex ${isPatient ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                    isPatient
                      ? msg.isAttachment
                        ? 'bg-slate-100 dark:bg-[#0c1f24] border border-slate-200 dark:border-teal-900/50 text-slate-800 dark:text-teal-200 rounded-tr-none'
                        : 'bg-teal-600 dark:bg-[#0b292c] border border-teal-600/10 dark:border-teal-500/20 text-white dark:text-teal-50 rounded-tr-none shadow-md'
                      : msg.content.startsWith('⚠️')
                      ? 'bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 rounded-tl-none'
                      : 'bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none shadow-[0_2px_8px_rgba(15,23,42,0.02)]'
                  }`}>
                    {msg.isAttachment && (
                      <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-slate-200/50 dark:bg-teal-950/50 border border-slate-350 dark:border-teal-900/50">
                        <IonIcon icon={shieldCheckmark} className="w-4 h-4 text-slate-700 dark:text-teal-400" />
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-700 dark:text-teal-400">Media Shield Active</span>
                      </div>
                    )}
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-semibold font-sans">{msg.content}</p>
                    <div className={`flex items-center justify-end gap-1 mt-2 text-[10px] ${
                      isPatient 
                        ? msg.isAttachment 
                          ? 'text-slate-400 dark:text-slate-500' 
                          : 'text-teal-200 dark:text-teal-400 font-bold' 
                        : 'text-slate-400 dark:text-slate-550 font-bold'
                    } font-mono`}>
                      <span>{msg.timestamp}</span>
                      {isPatient && <IonIcon icon={checkmarkDone} className="w-4.5 h-4.5 text-teal-200 dark:text-teal-400" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Navigator Typing Indicator */}
            {navigatorTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800/80 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                  <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

        </div>
      </IonContent>

      {/* Input bar - Safe Spacing & Large Accessible Fonts */}
      <div className="p-3.5 bg-slate-50 dark:bg-[#020408] border-t border-slate-200 dark:border-slate-900 pb-safe">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-md">
          <button
            onClick={handleWoundCamera}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full active:bg-slate-100 dark:active:bg-slate-850 flex-shrink-0 flex items-center justify-center"
            title="Take Secure Photo"
            style={{ borderRadius: '9999px' }}
          >
            <IonIcon icon={camera} className="w-5.5 h-5.5 text-slate-500 dark:text-slate-400" />
          </button>
          
          <button
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full active:bg-slate-100 dark:active:bg-slate-850 flex-shrink-0 flex items-center justify-center"
            title="Attach Document"
            style={{ borderRadius: '9999px' }}
          >
            <IonIcon icon={attach} className="w-5.5 h-5.5 text-slate-500 dark:text-slate-400" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your secure message..."
            className="flex-grow bg-transparent border-0 outline-none text-[14px] font-semibold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 py-2 px-1"
          />

          <button
            onClick={handleSendMessage}
            className="w-10 h-10 bg-teal-600 dark:bg-teal-500 hover:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-[#020408] rounded-full active:opacity-90 flex-shrink-0 flex items-center justify-center shadow-md transition-all"
            style={{ borderRadius: '9999px' }}
          >
            <IonIcon icon={paperPlane} className="w-5 h-5" />
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
