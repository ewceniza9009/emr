import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!activeThreadId) return;
    
    const token = (session?.user as any)?.token;
    if (!token) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:34732'}/hubs/chat`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connection.start().then(() => {
      connection.invoke('JoinCareThread', activeThreadId);
    }).catch(err => console.error('Clinician SignalR Error:', err));

    connection.on('ReceiveMessage', (message: any) => {
      setMessages(prev => {
        if (prev.find(m => m.chatMessageId === message.chatMessageId)) return prev;
        return [...prev, message];
      });

      if (!isOpenRef.current && message.senderRole !== 'navigator') {
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      connection.stop();
    };
  }, [activeThreadId, session]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeThreadId) return;
    try {
      await sendMessageMutation({
        variables: {
          patientId,
          careThreadId: activeThreadId,
          content: inputText
        }
      });
      setInputText('');
    } catch (e) {
      console.error(e);
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
              {messages.map((m, idx) => (
                <div key={m.chatMessageId || idx} className={`flex ${m.senderRole === 'navigator' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-[80%] text-sm ${m.senderRole === 'navigator' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                    <div className="font-semibold text-[10px] mb-1 opacity-70 uppercase tracking-wider">
                      {m.senderRole === 'navigator' ? 'Care Navigator' : 'Patient'}
                    </div>
                    {m.content}
                  </div>
                </div>
              ))}
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
