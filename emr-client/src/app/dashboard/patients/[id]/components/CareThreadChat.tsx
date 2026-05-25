import React, { useState, useEffect, useRef } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { MessageSquare, X, Send, Check, CheckCheck, Lock, Shield, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import HalcyonPortal from '@/components/Portal';

const PALLIATIVE_TEMPLATES = [
  {
    label: "Symptom Check",
    text: "Hello, this is your Care Navigator. How are your symptoms and pain level today on a scale of 1 to 10?",
  },
  {
    label: "Medication Remind",
    text: "Hi, just confirming if you were able to take your scheduled medications today. Are you experiencing any side effects?",
  },
  {
    label: "Comfort Level",
    text: "Hello, checking in on your comfort. Are you experiencing any difficulty breathing, anxiety, or nausea today?",
  },
  {
    label: "General Care",
    text: "Hi, just checking in to see how you and your family are doing. Please let me know if there's anything you need.",
  },
];

const GET_PATIENT_THREADS = gql`
  query GetPatientChatThreads($patientId: UUID!) {
    patientChatThreads(patientId: $patientId) {
      careThreadId
      subject
      messages {
        chatMessageId
        content
        senderRole
        timestamp
        isSeen
      }
    }
  }
`;

const SEND_NAVIGATOR_MESSAGE = gql`
  mutation SendNavigatorMessage($patientId: UUID!, $careThreadId: UUID!, $content: String!) {
    sendNavigatorChatMessage(patientId: $patientId, careThreadId: $careThreadId, content: $content) {
      chatMessageId
      content
      senderRole
      timestamp
      isSeen
    }
  }
`;

export function CareThreadChat({ 
  patientId, 
  forceOpen = false, 
  onCloseOverride 
}: { 
  patientId: string; 
  forceOpen?: boolean; 
  onCloseOverride?: () => void; 
}) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [unreadCount, setUnreadCount] = useState(0);

  const isOpenRef = React.useRef(isOpen);

  const templatesRef = useRef<HTMLDivElement>(null);

  const scrollTemplates = (direction: 'left' | 'right') => {
    if (templatesRef.current) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      templatesRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const { data } = useQuery(GET_PATIENT_THREADS, {
    variables: { patientId },
    skip: !patientId,
    fetchPolicy: 'network-only'
  });

  useEffect(() => {
    const threads = data?.patientChatThreads;
    if (threads && threads.length > 0) {
      setActiveThreadId(threads[0].careThreadId);
      const msgs = threads[0].messages || [];
      setMessages(msgs);
      if (!isOpenRef.current) {
        const unread = msgs.filter((m: any) => m.senderRole !== 'navigator' && !m.isSeen).length;
        setUnreadCount(unread);
      }
    }
  }, [data]);

  const [sendMessageMutation] = useMutation(SEND_NAVIGATOR_MESSAGE);
  const connectionRef = useRef<any>(null);

  const token = (session?.user as any)?.token;

  useEffect(() => {
    if (!activeThreadId || !token) return;

    let isMounted = true;

    const connection = new HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:34732'}/hubs/chat`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    // Re-join the thread group after a network reconnect
    connection.onreconnected(() => {
      if (isMounted && activeThreadId) {
        connection.invoke('JoinCareThread', activeThreadId).catch(() => {});
        if (isOpenRef.current) {
          connection.invoke('MarkAsSeen', activeThreadId, 'navigator').catch(() => {});
        }
      }
    });

    connection.on('ReceiveMessage', (message: any) => {
      if (!isMounted) return;
      setMessages(prev => {
        const exists = prev.some(m => m.chatMessageId === message.chatMessageId);
        if (exists) return prev;
        // Filter out temporary optimistic messages of same content
        const filtered = prev.filter(m => !(String(m.chatMessageId).startsWith('temp-') && m.content === message.content && m.senderRole === message.senderRole));
        return [...filtered, message];
      });

      if (!isOpenRef.current && message.senderRole !== 'navigator') {
        setUnreadCount(prev => prev + 1);
      } else if (isOpenRef.current && message.senderRole !== 'navigator') {
        // Chat is open, so mark new patient message seen instantly
        connection.invoke('MarkAsSeen', activeThreadId, 'navigator')
          .catch((err: any) => console.error("Error invoking seen:", err));
      }
    });

    connection.on('MessageSeen', (careThreadId: string, senderRole: string) => {
      if (!isMounted) return;
      if (careThreadId === activeThreadId && senderRole === 'patient') {
        // Patient viewed navigator messages -> mark all navigator messages in active view as seen!
        setMessages(prev => prev.map(m => m.senderRole === 'navigator' ? { ...m, isSeen: true } : m));
      }
    });

    connection.start().then(() => {
      if (isMounted) {
        connection.invoke('JoinCareThread', activeThreadId);
        if (isOpenRef.current) {
          connection.invoke('MarkAsSeen', activeThreadId, 'navigator')
            .catch((err: any) => console.error("Error invoking seen:", err));
        }
      }
    }).catch(err => console.error('Clinician SignalR Error:', err));

    return () => {
      isMounted = false;
      connection.stop().catch(() => {});
    };
  }, [activeThreadId, token]);

  // Notify patient when clinician modal transitions to open
  useEffect(() => {
    if (isOpen && activeThreadId && connectionRef.current && connectionRef.current.state === 'Connected') {
      connectionRef.current.invoke('MarkAsSeen', activeThreadId, 'navigator')
        .catch((err: any) => console.error("Error invoking seen receipt:", err));
    }
  }, [isOpen, messages.length, activeThreadId]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeThreadId) return;
    
    const sentText = inputText;
    setInputText('');

    // Optimistic message creation
    const tempMsg = {
      chatMessageId: `temp-${Date.now()}`,
      content: sentText,
      senderRole: 'navigator',
      timestamp: new Date().toISOString(),
      isSeen: false
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await sendMessageMutation({
        variables: {
          patientId,
          careThreadId: activeThreadId,
          content: sentText
        }
      });
    } catch (e) {
      console.error(e);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.chatMessageId !== tempMsg.chatMessageId));
    }
  };

  return (
    <>
      <div className="group relative flex items-center justify-center hover:z-[60]">
        <button 
          onClick={() => setIsOpen(true)}
          className="relative w-10 h-10 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-all flex items-center justify-center p-0 active:scale-95"
        >
          <MessageSquare className="w-5 h-5 shrink-0" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 items-center justify-center text-[8px] font-black text-white leading-none">
                {unreadCount}
              </span>
            </span>
          )}
        </button>

        {/* Premium Tooltip */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-200 z-50 flex flex-col items-center">
          <div className="w-1.5 h-1.5 bg-slate-950 border-l border-t border-slate-800/80 rotate-45 -mb-1 shrink-0 z-10" />
          <div className="bg-slate-950 border border-slate-800/80 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap">
            Secure Care Chat
          </div>
        </div>
      </div>

      {isOpen && (
        <HalcyonPortal>
          <div 
            onClick={handleOutsideClick}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          >
            <div className="bg-[var(--card-bg)] rounded-2xl w-full max-w-lg h-[550px] flex flex-col shadow-2xl overflow-hidden border border-[var(--card-border)] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-[var(--card-border)] bg-[var(--card-bg)] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    Care Navigation Secure Chat
                  </h3>
                  <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Secure HIPAA Link
                  </span>
                </div>
              </div>
              <button 
                onClick={() => { setIsOpen(false); if (onCloseOverride) onCloseOverride(); }} 
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--card-border)] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-[var(--background)] custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] opacity-60">
                  <MessageSquare className="w-8 h-8 mb-2 animate-bounce" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">No message history available</span>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isSelf = m.senderRole === 'navigator';
                  const isSeen = m.isSeen || String(m.chatMessageId).startsWith('temp-');

                  return (
                    <div key={m.chatMessageId || idx} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[75%] flex flex-col">
                        {/* Sender Label */}
                        <div className={`flex items-center gap-1.5 mb-1 px-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] ${isSelf ? 'justify-end' : 'justify-start'}`}>
                          <span>{isSelf ? 'Care Navigator' : 'Patient'}</span>
                          <span className="text-[var(--card-border)]">•</span>
                          <span className="font-mono text-[8px]">
                            {new Date(m.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>

                        <div className={`p-3 rounded-2xl shadow-sm text-sm break-words font-medium leading-relaxed ${
                          isSelf 
                            ? 'bg-[var(--primary)] text-white rounded-tr-none shadow-md shadow-[var(--primary)]/10' 
                            : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-tl-none'
                        }`}>
                          <div>{m.content}</div>
                          {isSelf && (
                            <div className="flex items-center justify-end gap-1 mt-1 text-[8px] opacity-85 font-semibold select-none">
                              {isSeen ? (
                                <span className="text-emerald-100 flex items-center gap-0.5" title="Read by Patient">
                                  Read <CheckCheck className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="text-teal-200/80 flex items-center gap-0.5" title="Sent to Server">
                                  Sent <Check className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sideways Scrollable Quick Templates */}
            <div className="flex items-center gap-1.5 px-4 py-2 border-t border-[var(--card-border)] bg-[var(--card-bg)] shrink-0 relative">
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20 animate-pulse" /> Templates:
              </span>

              {/* Scroll Left */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollTemplates('left'); }}
                className="w-5 h-5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--primary)]/30 text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center justify-center transition-all shrink-0 active:scale-90"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Scrollable Container */}
              <div 
                ref={templatesRef}
                className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth py-1 px-0.5"
              >
                {PALLIATIVE_TEMPLATES.map((tmpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setInputText(tmpl.text);
                    }}
                    className="text-[9px] font-bold bg-[var(--input-bg)] hover:bg-[var(--primary)]/15 border border-[var(--card-border)] hover:border-[var(--primary)]/30 rounded-full px-3 py-1 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all whitespace-nowrap active:scale-95 uppercase tracking-wider shrink-0"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>

              {/* Scroll Right */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollTemplates('right'); }}
                className="w-5 h-5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--primary)]/30 text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center justify-center transition-all shrink-0 active:scale-90"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-[var(--card-border)] bg-[var(--card-bg)] flex flex-col gap-2.5 shrink-0">
              <div className="flex gap-2">
                <input 
                  className="flex-1 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:bg-[var(--background)] focus:ring-2 focus:ring-[var(--primary)]/35 focus:border-[var(--primary)]/55 transition-all outline-none font-medium"
                  value={inputText} 
                  onChange={(e: any) => setInputText(e.target.value)} 
                  onKeyDown={(e: any) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your secure message..." 
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 active:scale-95 disabled:opacity-50 disabled:scale-100 text-white px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </div>

              {/* HIPAA Secure Bar */}
              <div className="flex items-center justify-between text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">
                <span className="flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-[var(--primary)]" />
                  HIPAA Secure End-to-End Encryption
                </span>
                <span>Audited Channel</span>
              </div>
            </div>

          </div>
        </div>
      </HalcyonPortal>
      )}
    </>
  );
}
