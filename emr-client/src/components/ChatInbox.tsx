import React, { useState, useEffect } from 'react';
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
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const router = useRouter();

  const { data, refetch } = useQuery(GET_INBOX_THREADS, {
    skip: !isOpen,
    fetchPolicy: 'network-only'
  });

  const threads = data?.myInboxThreads || [];
  const activeThread = threads.find((t: any) => t.careThreadId === activeThreadId);

  const [sendMessageMutation] = useMutation(SEND_NAVIGATOR_MESSAGE);

  useEffect(() => {
    if (!isOpen) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3671'}/hubs/chat`, {
        accessTokenFactory: () => (session?.user as any)?.token || ''
      })
      .configureLogging(LogLevel.Information)
      .build();

    connection.start().then(() => {
      // Join all thread groups to listen for new messages
      threads.forEach((t: any) => {
        connection.invoke('JoinCareThread', t.careThreadId);
      });
    });

    connection.on('ReceiveMessage', (message: any) => {
      // In a real app we'd update Apollo cache. Here we'll just refetch for simplicity.
      refetch();
    });

    return () => {
      connection.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, threads.length, refetch]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeThread) return;
    try {
      await sendMessageMutation({
        variables: {
          patientId: activeThread.patient.patientId,
          careThreadId: activeThread.careThreadId,
          content: inputText
        }
      });
      setInputText('');
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-9 h-9 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center hover:border-[var(--primary)]/30 transition-all text-[var(--text-muted)] hover:text-[var(--primary)] relative"
      >
        <MessageCircle className="w-4 h-4" />
        {threads.length > 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[var(--sidebar-bg)] animate-pulse" />
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
                  <div className="p-4 text-xs text-slate-500 text-center mt-4">No active chats</div>
                ) : (
                  threads.map((t: any) => (
                    <button 
                      key={t.careThreadId}
                      onClick={() => setActiveThreadId(t.careThreadId)}
                      className={`w-full text-left p-4 border-b border-slate-200 dark:border-slate-800 transition-colors ${activeThreadId === t.careThreadId ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                    >
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                        {t.patient.firstName} {t.patient.lastName}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 truncate">
                        {t.subject || 'Care Thread'}
                      </div>
                    </button>
                  ))
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
                {activeThread?.messages?.map((m: any, idx: number) => (
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
