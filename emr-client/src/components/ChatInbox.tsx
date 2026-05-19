import React, { useState, useEffect, useRef } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { MessageCircle, X, Search, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const GET_INBOX_THREADS = gql`
  query GetMyInboxThreads {
    myInboxThreads {
      careThreadId
      subject
      patient {
        patientId
        firstName
        lastName
        mrn
      }
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

export function ChatInbox() {
  const { data: session, status: sessionStatus } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const router = useRouter();

  const { data, refetch, error } = useQuery(GET_INBOX_THREADS, {
    fetchPolicy: 'network-only',
    skip: sessionStatus !== 'authenticated',
    pollInterval: 30000, // Heartbeat: refetch every 30s as safety net
  });

  // Log GraphQL errors for debugging
  useEffect(() => {
    if (error) {
      console.error('ChatInbox GraphQL Error:', error.message);
    }
  }, [error]);

  const rawThreads = data?.myInboxThreads || [];

  // Deduplicate active threads by patientId for the sidebar list
  const threads: any[] = [];
  const seenPatients = new Set<string>();
  for (const t of rawThreads) {
    if (t.patient && !seenPatients.has(t.patient.patientId)) {
      seenPatients.add(t.patient.patientId);
      threads.push(t);
    }
  }

  const activeThread = rawThreads.find((t: any) => t.careThreadId === activeThreadId);

  // Sync raw thread messages to local state
  useEffect(() => {
    if (activeThread?.messages) {
      setActiveMessages(activeThread.messages);
    } else {
      setActiveMessages([]);
    }
  }, [activeThreadId, activeThread?.messages]);

  const [sendMessageMutation] = useMutation(SEND_NAVIGATOR_MESSAGE);
  const [seenMessages, setSeenMessages] = useState<Record<string, boolean>>({});
  const connectionRef = useRef<any>(null);

  // Simulate real-time read receipt transitions for navigator's latest message
  useEffect(() => {
    if (activeMessages.length > 0) {
      const lastMsg = activeMessages[activeMessages.length - 1];
      if (lastMsg.senderRole === 'navigator' && !seenMessages[lastMsg.chatMessageId]) {
        const timer = setTimeout(() => {
          setSeenMessages(prev => ({ ...prev, [lastMsg.chatMessageId]: true }));
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [activeMessages, seenMessages]);

  const activeThreadIdRef = useRef<string | null>(activeThreadId);
  const rawThreadsRef = useRef<any[]>(rawThreads);
  const joinedThreadsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  useEffect(() => {
    rawThreadsRef.current = rawThreads;
  }, [rawThreads]);

  // Helper: join all known thread groups on a live connection
  const joinAllThreadGroups = (connection: any) => {
    joinedThreadsRef.current.clear();
    rawThreadsRef.current.forEach((t: any) => {
      joinedThreadsRef.current.add(t.careThreadId);
      connection.invoke('JoinCareThread', t.careThreadId)
        .catch((err: any) => {
          if (err?.name !== 'AbortError' && !err?.toString()?.includes('stopped')) {
            console.error("Error invoking JoinCareThread:", err);
          }
        });
    });
    if (activeThreadIdRef.current) {
      connection.invoke('MarkAsSeen', activeThreadIdRef.current, 'navigator')
        .catch((err: any) => {
          if (err?.name !== 'AbortError' && !err?.toString()?.includes('stopped')) {
            console.error("Error invoking MarkAsSeen on connect:", err);
          }
        });
    }
  };

  // Connect to SignalR socket globally on mount to enable background unread notifications
  // Stable token ref to avoid connection churn from session object reference changes
  const tokenRef = useRef<string | null>(null);
  useEffect(() => {
    tokenRef.current = (session?.user as any)?.token || null;
  }, [session]);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;
    const token = tokenRef.current;
    if (!token) return;

    let isMounted = true;

    const connection = new HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:34732'}/hubs/chat`, {
        accessTokenFactory: () => tokenRef.current || token
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    // Re-join all thread groups after a network reconnect so messages keep flowing
    connection.onreconnected(() => {
      if (isMounted) {
        joinAllThreadGroups(connection);
        refetch();
      }
    });

    connection.on('ReceiveMessage', (message: any) => {
      if (!isMounted) return;
      if (message.careThreadId === activeThreadIdRef.current) {
        setActiveMessages(prev => {
          const exists = prev.some(m => m.chatMessageId === message.chatMessageId);
          if (exists) return prev;
          // Filter out temporary optimistic messages of same content
          const filtered = prev.filter(m => !(String(m.chatMessageId).startsWith('temp-') && m.content === message.content && m.senderRole === message.senderRole));
          return [...filtered, message];
        });
      }
      refetch();
    });

    connection.on('MessageSeen', (careThreadId: string, senderRole: string) => {
      if (!isMounted) return;
      if (careThreadId === activeThreadIdRef.current && senderRole === 'patient') {
        // Patient viewed navigator messages -> mark all navigator messages in active view as seen!
        setActiveMessages(prev => prev.map(m => m.senderRole === 'navigator' ? { ...m, isSeen: true } : m));
      }
    });

    connection.start().then(() => {
      if (isMounted) {
        joinAllThreadGroups(connection);
      }
    }).catch(err => {
      const isAbort = err?.name === 'AbortError' || err?.toString()?.includes('stopped');
      if (!isAbort) {
        console.error("SignalR Chat Error:", err);
      }
    });

    return () => {
      isMounted = false;
      connection.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]);

  // Dynamically join new threads as they load or get created
  useEffect(() => {
    const connection = connectionRef.current;
    if (connection && connection.state === 'Connected') {
      rawThreads.forEach((t: any) => {
        if (!joinedThreadsRef.current.has(t.careThreadId)) {
          joinedThreadsRef.current.add(t.careThreadId);
          connection.invoke('JoinCareThread', t.careThreadId)
            .catch((err: any) => {
              if (err?.name !== 'AbortError' && !err?.toString()?.includes('stopped')) {
                console.error("Error joining care thread dynamically:", err);
              }
            });
        }
      });
    }
  }, [rawThreads]);

  // Invoke MarkAsSeen to notify patient's mobile app in real-time when activeThreadId changes or new message is selected
  useEffect(() => {
    if (activeThreadId && connectionRef.current && connectionRef.current.state === 'Connected') {
      connectionRef.current.invoke('MarkAsSeen', activeThreadId, 'navigator')
        .catch((err: any) => {
          if (err?.name !== 'AbortError' && !err?.toString()?.includes('stopped')) {
            console.error("Error invoking seen receipt:", err);
          }
        });
    }
  }, [activeThreadId, activeMessages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeThread) return;
    
    const sentText = inputText;
    setInputText('');

    // Optimistic message creation
    const tempMsg = {
      chatMessageId: `temp-${Date.now()}`,
      content: sentText,
      senderRole: 'navigator',
      timestamp: new Date().toISOString()
    };
    setActiveMessages(prev => [...prev, tempMsg]);

    try {
      await sendMessageMutation({
        variables: {
          patientId: activeThread.patient.patientId,
          careThreadId: activeThread.careThreadId,
          content: sentText
        }
      });
      refetch();
    } catch (e) {
      console.error(e);
      // Remove optimistic message on failure
      setActiveMessages(prev => prev.filter(m => m.chatMessageId !== tempMsg.chatMessageId));
    }
  };

  // Calculate unread threads (threads where the last message is from the patient/caregiver)
  const unreadThreads = rawThreads.filter((t: any) => {
    const messages = t.messages || [];
    if (messages.length === 0) return false;
    const lastMessage = messages[messages.length - 1];
    return lastMessage.senderRole !== 'navigator';
  });

  const hasUnread = unreadThreads.length > 0;
  const unreadCount = unreadThreads.length;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-9 h-9 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center hover:border-[var(--primary)]/30 transition-all text-[var(--text-muted)] hover:text-[var(--primary)] relative active:scale-95"
      >
        <MessageCircle className="w-4 h-4" />
        {hasUnread && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 items-center justify-center text-[8px] font-black text-white leading-none">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/20 backdrop-blur-sm">
          <div className="w-full max-w-2xl h-full bg-white dark:bg-slate-900 shadow-2xl flex border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
            
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-950/50">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-indigo-500" />
                  Chat Inbox
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                {threads.length === 0 ? (
                  <div className="p-4 text-xs text-slate-550 text-center mt-4">No active chats</div>
                ) : (
                  threads.map((t: any) => {
                    const isThreadUnread = (() => {
                      const messages = t.messages || [];
                      if (messages.length === 0) return false;
                      const lastMessage = messages[messages.length - 1];
                      return lastMessage.senderRole !== 'navigator';
                    })();

                    return (
                      <button 
                        key={t.careThreadId}
                        onClick={() => setActiveThreadId(t.careThreadId)}
                        className={`w-full text-left p-4 border-b border-slate-200 dark:border-slate-800 transition-colors relative ${activeThreadId === t.careThreadId ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                      >
                        <div className="flex justify-between items-center gap-2">
                          <div className={`text-sm truncate ${isThreadUnread ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-800 dark:text-slate-100'}`}>
                            {t.patient.firstName} {t.patient.lastName}
                          </div>
                          {isThreadUnread && (
                            <span className="flex h-2 w-2 relative shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                          )}
                        </div>
                        <div className={`text-[10px] mt-1 truncate ${isThreadUnread ? 'font-bold text-slate-700 dark:text-slate-350' : 'text-slate-500'}`}>
                          {t.subject || 'Care Thread'}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
              <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-4">
                {activeThread ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{activeThread.patient.firstName} {activeThread.patient.lastName}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{activeThread.patient.mrn}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-medium text-slate-500">Select a chat</div>
                )}
                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-950/30">
                {!activeThread && (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    Select a conversation from the left to start chatting.
                  </div>
                )}
                {activeMessages?.map((m: any, idx: number) => (
                  <div key={m.chatMessageId || idx} className={`flex ${m.senderRole === 'navigator' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-lg max-w-[80%] text-sm ${m.senderRole === 'navigator' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'}`}>
                      <div className="font-semibold text-[9px] mb-1 opacity-70 uppercase tracking-widest">
                        {m.senderRole === 'navigator' ? 'You' : 'Patient'}
                      </div>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>

              {activeThread && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                      value={inputText} 
                      onChange={(e: any) => setInputText(e.target.value)} 
                      onKeyDown={(e: any) => e.key === 'Enter' && handleSend()}
                      placeholder="Type a secure reply..." 
                    />
                    <button 
                      onClick={handleSend}
                      className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
