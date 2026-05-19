import React, { useState, useEffect, useRef } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { MessageSquare, X } from 'lucide-react';
import { useSession } from 'next-auth/react';

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
    }
  }
`;

export function CareThreadChat({ patientId }: { patientId: string }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isOpenRef = React.useRef(isOpen);

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
      setMessages(threads[0].messages || []);
    }
  }, [data]);

  const [sendMessageMutation] = useMutation(SEND_NAVIGATOR_MESSAGE);
  const [seenMessages, setSeenMessages] = useState<Record<string, boolean>>({});
  const connectionRef = useRef<any>(null);

  // Simulate real-time read receipt transitions for navigator's latest message
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderRole === 'navigator' && !seenMessages[lastMsg.chatMessageId]) {
        const timer = setTimeout(() => {
          setSeenMessages(prev => ({ ...prev, [lastMsg.chatMessageId]: true }));
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [messages, seenMessages]);

  useEffect(() => {
    if (!activeThreadId) return;
    
    const token = (session?.user as any)?.token;
    if (!token) return;

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
  }, [activeThreadId, session]);

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
      timestamp: new Date().toISOString()
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
      <button 
        onClick={() => setIsOpen(true)}
        className="relative px-6 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center gap-2 active:scale-95"
      >
        <MessageSquare className="w-3.5 h-3.5" /> Live Chat
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 items-center justify-center text-[8px] font-black text-white leading-none">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md h-[500px] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Care Navigation Secure Chat</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-50 dark:bg-slate-950">
              {messages.map((m, idx) => {
                const isLastMessage = idx === messages.length - 1;
                const isSeen = !isLastMessage || m.senderRole !== 'navigator' || String(m.chatMessageId).startsWith('temp-') || seenMessages[m.chatMessageId];

                return (
                  <div key={m.chatMessageId || idx} className={`flex ${m.senderRole === 'navigator' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-lg max-w-[80%] text-sm ${m.senderRole === 'navigator' ? 'bg-indigo-600 text-white rounded-br-none shadow-sm' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'}`}>
                      <div className="font-semibold text-[9px] mb-1 opacity-70 uppercase tracking-widest flex justify-between items-center gap-4 select-none">
                        <span>{m.senderRole === 'navigator' ? 'You' : 'Patient'}</span>
                        <span className="text-[8px] font-normal lowercase opacity-80">{new Date(m.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="break-words font-medium">{m.content}</div>
                      {m.senderRole === 'navigator' && (
                        <div className="flex items-center justify-end gap-1 mt-1 text-[8px] opacity-75 font-semibold select-none">
                          {isSeen ? (
                            <span className="text-indigo-200 flex items-center gap-0.5">
                              Seen <span className="text-[10px] leading-none font-bold">✓✓</span>
                            </span>
                          ) : (
                            <span className="text-indigo-300/85 flex items-center gap-0.5 animate-pulse">
                              Sent <span className="text-[10px] leading-none">✓</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
              <input 
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={inputText} 
                onChange={(e: any) => setInputText(e.target.value)} 
                onKeyDown={(e: any) => e.key === 'Enter' && handleSend()}
                placeholder="Type your secure message..." 
              />
              <button 
                onClick={handleSend}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
