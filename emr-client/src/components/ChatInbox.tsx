import React, { useState, useEffect, useRef, useMemo } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import {
  MessageCircle,
  X,
  Search,
  User,
  Lock,
  Shield,
  Check,
  CheckCheck,
  Send,
  ExternalLink,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

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
        isSeen
      }
    }
  }
`;

const SEND_NAVIGATOR_MESSAGE = gql`
  mutation SendNavigatorMessage(
    $patientId: UUID!
    $careThreadId: UUID!
    $content: String!
  ) {
    sendNavigatorChatMessage(
      patientId: $patientId
      careThreadId: $careThreadId
      content: $content
    ) {
      chatMessageId
      content
      senderRole
      timestamp
      isSeen
    }
  }
`;

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

export function ChatInbox() {
  const { data: session, status: sessionStatus } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const router = useRouter();
  const templatesRef = useRef<HTMLDivElement>(null);

  const scrollTemplates = (direction: "left" | "right") => {
    if (templatesRef.current) {
      const scrollAmount = direction === "left" ? -150 : 150;
      templatesRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const { data, refetch, error } = useQuery(GET_INBOX_THREADS, {
    fetchPolicy: "network-only",
    skip: sessionStatus !== "authenticated",
    pollInterval: 30000, // Heartbeat: refetch every 30s as safety net
  });

  // Log GraphQL errors for debugging
  useEffect(() => {
    if (error) {
      console.error("ChatInbox GraphQL Error:", error.message);
    }
  }, [error]);

  const rawThreads = data?.myInboxThreads || [];

  // Deduplicate active threads by patientId for the sidebar list
  const threads = useMemo(() => {
    const list: any[] = [];
    const seenPatients = new Set<string>();
    for (const t of rawThreads) {
      if (t.patient && !seenPatients.has(t.patient.patientId)) {
        seenPatients.add(t.patient.patientId);
        list.push(t);
      }
    }
    return list;
  }, [rawThreads]);

  // Filter threads by search term (patient name or MRN)
  const filteredThreads = useMemo(() => {
    return threads.filter((t: any) => {
      const fullName =
        `${t.patient.firstName || ""} ${t.patient.lastName || ""}`.toLowerCase();
      const mrn = (t.patient.mrn || "").toLowerCase();
      const query = searchTerm.toLowerCase();
      return fullName.includes(query) || mrn.includes(query);
    });
  }, [threads, searchTerm]);

  // Auto-select first thread with notification or first thread overall when opened
  useEffect(() => {
    if (isOpen && threads.length > 0 && !activeThreadId) {
      const firstUnreadThread = threads.find((t: any) => {
        const messages = t.messages || [];
        return messages.some(
          (m: any) => m.senderRole !== "navigator" && !m.isSeen,
        );
      });
      if (firstUnreadThread) {
        setActiveThreadId(firstUnreadThread.careThreadId);
      } else {
        setActiveThreadId(threads[0].careThreadId);
      }
    }
  }, [isOpen, threads, activeThreadId]);

  const activeThread = rawThreads.find(
    (t: any) => t.careThreadId === activeThreadId,
  );

  // Sync raw thread messages to local state
  useEffect(() => {
    if (activeThread?.messages) {
      setActiveMessages(activeThread.messages);
    } else {
      setActiveMessages([]);
    }
  }, [activeThreadId, activeThread?.messages]);

  const [sendMessageMutation] = useMutation(SEND_NAVIGATOR_MESSAGE);
  const connectionRef = useRef<any>(null);

  const activeThreadIdRef = useRef<string | null>(activeThreadId);
  const rawThreadsRef = useRef<any[]>(rawThreads);
  const joinedThreadsRef = useRef<Set<string>>(new Set());
  const isOpenRef = useRef<boolean>(isOpen);

  useEffect(() => {
    activeThreadIdRef.current = activeThreadId;
  }, [activeThreadId]);

  useEffect(() => {
    rawThreadsRef.current = rawThreads;
  }, [rawThreads]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Helper: join all known thread groups on a live connection
  const joinAllThreadGroups = (connection: any) => {
    joinedThreadsRef.current.clear();
    rawThreadsRef.current.forEach((t: any) => {
      joinedThreadsRef.current.add(t.careThreadId);
      connection.invoke("JoinCareThread", t.careThreadId).catch((err: any) => {
        if (
          err?.name !== "AbortError" &&
          !err?.toString()?.includes("stopped")
        ) {
          console.error("Error invoking JoinCareThread:", err);
        }
      });
    });
    if (activeThreadIdRef.current && isOpenRef.current) {
      connection
        .invoke("MarkAsSeen", activeThreadIdRef.current, "navigator")
        .catch((err: any) => {
          if (
            err?.name !== "AbortError" &&
            !err?.toString()?.includes("stopped")
          ) {
            console.error("Error invoking MarkAsSeen on connect:", err);
          }
        });
    }
  };

  // Connect to SignalR socket globally on mount to enable background unread notifications stably using primitive token dependency
  const token = (session?.user as any)?.token;

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !token) return;

    let isMounted = true;

    const connection = new HubConnectionBuilder()
      .withUrl(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:34732"}/hubs/chat`,
        {
          accessTokenFactory: () => token,
        },
      )
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

    connection.on("ReceiveMessage", (message: any) => {
      if (!isMounted) return;
      if (message.careThreadId === activeThreadIdRef.current) {
        setActiveMessages((prev) => {
          const exists = prev.some(
            (m) => m.chatMessageId === message.chatMessageId,
          );
          if (exists) return prev;
          // Filter out temporary optimistic messages of same content
          const filtered = prev.filter(
            (m) =>
              !(
                String(m.chatMessageId).startsWith("temp-") &&
                m.content === message.content &&
                m.senderRole === message.senderRole
              ),
          );
          return [...filtered, message];
        });
        if (message.senderRole !== "navigator" && isOpenRef.current) {
          connection
            .invoke("MarkAsSeen", message.careThreadId, "navigator")
            .catch(() => {});
        }
      }
      refetch();
    });

    connection.on("MessageSeen", (careThreadId: string, senderRole: string) => {
      if (!isMounted) return;
      if (
        careThreadId === activeThreadIdRef.current &&
        senderRole === "patient"
      ) {
        // Patient viewed navigator messages -> mark all navigator messages in active view as seen!
        setActiveMessages((prev) =>
          prev.map((m) =>
            m.senderRole === "navigator" ? { ...m, isSeen: true } : m,
          ),
        );
      }
      refetch();
    });

    connection
      .start()
      .then(() => {
        if (isMounted) {
          joinAllThreadGroups(connection);
        }
      })
      .catch((err) => {
        const isAbort =
          err?.name === "AbortError" || err?.toString()?.includes("stopped");
        if (!isAbort) {
          console.error("SignalR Chat Error:", err);
        }
      });

    return () => {
      isMounted = false;
      connection.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, token]);

  // Dynamically join new threads as they load or get created
  useEffect(() => {
    const connection = connectionRef.current;
    if (connection && connection.state === "Connected") {
      rawThreads.forEach((t: any) => {
        if (!joinedThreadsRef.current.has(t.careThreadId)) {
          joinedThreadsRef.current.add(t.careThreadId);
          connection
            .invoke("JoinCareThread", t.careThreadId)
            .catch((err: any) => {
              if (
                err?.name !== "AbortError" &&
                !err?.toString()?.includes("stopped")
              ) {
                console.error("Error joining care thread dynamically:", err);
              }
            });
        }
      });
    }
  }, [rawThreads]);

  // Invoke MarkAsSeen to notify patient's mobile app in real-time when activeThreadId changes or new message is selected (only if open)
  useEffect(() => {
    if (
      isOpen &&
      activeThreadId &&
      connectionRef.current &&
      connectionRef.current.state === "Connected"
    ) {
      connectionRef.current
        .invoke("MarkAsSeen", activeThreadId, "navigator")
        .then(() => {
          refetch();
        })
        .catch((err: any) => {
          if (
            err?.name !== "AbortError" &&
            !err?.toString()?.includes("stopped")
          ) {
            console.error("Error invoking seen receipt:", err);
          }
        });
    }
  }, [isOpen, activeThreadId, activeMessages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeThread) return;

    const sentText = inputText;
    setInputText("");

    // Optimistic message creation
    const tempMsg = {
      chatMessageId: `temp-${Date.now()}`,
      content: sentText,
      senderRole: "navigator",
      timestamp: new Date().toISOString(),
    };
    setActiveMessages((prev) => [...prev, tempMsg]);

    try {
      await sendMessageMutation({
        variables: {
          patientId: activeThread.patient.patientId,
          careThreadId: activeThread.careThreadId,
          content: sentText,
        },
      });
      refetch();
    } catch (e) {
      console.error(e);
      // Remove optimistic message on failure
      setActiveMessages((prev) =>
        prev.filter((m) => m.chatMessageId !== tempMsg.chatMessageId),
      );
    }
  };

  // Calculate total unread messages count across all threads
  const unreadCount = rawThreads.reduce((acc: number, t: any) => {
    const messages = t.messages || [];
    return (
      acc +
      messages.filter((m: any) => m.senderRole !== "navigator" && !m.isSeen)
        .length
    );
  }, 0);

  const hasUnread = unreadCount > 0;

  const formatMessageTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  };

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
      setActiveThreadId(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-9 h-9 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center hover:border-[var(--primary)]/30 transition-all text-[var(--text-muted)] hover:text-[var(--primary)] relative active:scale-95"
      >
        <MessageCircle className="w-4 h-4" />
        {hasUnread && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 items-center justify-center text-[8px] font-black text-white leading-none">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div
          onClick={handleOutsideClick}
          className="fixed inset-0 z-[150] flex justify-end bg-black/40 backdrop-blur-sm transition-all duration-350"
        >
          <div className="w-full max-w-3xl h-full bg-[var(--card-bg)] shadow-2xl flex border-l border-[var(--card-border)] animate-in slide-in-from-right duration-300 overflow-hidden">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-[var(--card-border)] flex flex-col bg-[var(--sidebar-bg)] shrink-0">
              {/* Header */}
              <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--card-bg)]">
                <h3 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-[var(--primary)]" />
                  Clinical Inbox
                </h3>
                <span className="px-1.5 py-0.5 text-[8px] font-black bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/25 uppercase tracking-widest leading-none">
                  Live
                </span>
              </div>

              {/* Patient Search */}
              <div className="p-3 border-b border-[var(--card-border)] bg-[var(--card-bg)]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search patient name or MRN..."
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-9 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]/50 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Threads List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--background)]">
                {filteredThreads.length === 0 ? (
                  <div className="p-4 text-xs text-[var(--text-muted)] text-center mt-4 font-medium">
                    {searchTerm ? "No matching patients" : "No active chats"}
                  </div>
                ) : (
                  filteredThreads.map((t: any) => {
                    const isThreadUnread = (t.messages || []).some(
                      (m: any) => m.senderRole !== "navigator" && !m.isSeen,
                    );
                    const isActive = activeThreadId === t.careThreadId;

                    return (
                      <button
                        key={t.careThreadId}
                        onClick={() => setActiveThreadId(t.careThreadId)}
                        className={`w-full text-left p-3.5 border-b border-[var(--card-border)] transition-all relative ${
                          isActive
                            ? "bg-[var(--primary)]/10 border-l-4 border-l-[var(--primary)]"
                            : "hover:bg-[var(--input-bg)]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0 ${
                              isActive
                                ? "bg-[var(--primary)] text-white"
                                : "bg-[var(--input-bg)] text-[var(--text-secondary)] border border-[var(--card-border)]"
                            }`}
                          >
                            {t.patient.firstName[0]}
                            {t.patient.lastName[0]}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center gap-2">
                              <div
                                className={`text-xs truncate ${isThreadUnread ? "font-black text-[var(--text-primary)]" : "font-bold text-[var(--text-secondary)]"}`}
                              >
                                {t.patient.firstName} {t.patient.lastName}
                              </div>
                              {isThreadUnread && (
                                <span className="flex h-2 w-2 relative shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-center mt-0.5 text-[9px] text-[var(--text-muted)]">
                              <span className="truncate">
                                {t.subject || "Care Thread"}
                              </span>
                              <span className="shrink-0 font-mono tracking-tighter">
                                MRN: {t.patient.mrn}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-[var(--background)] min-w-0 overflow-hidden">
              {/* Header */}
              <div className="h-14 border-b border-[var(--card-border)] flex justify-between items-center px-4 bg-[var(--card-bg)] shrink-0">
                {activeThread ? (
                  <div className="flex-1 flex justify-between items-center mr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-[var(--primary)]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[var(--text-primary)]">
                            {activeThread.patient.firstName}{" "}
                            {activeThread.patient.lastName}
                          </span>
                          <span className="px-1.5 py-0.5 text-[8px] font-black bg-[var(--primary)]/10 text-[var(--primary)] rounded border border-[var(--primary)]/25 uppercase tracking-widest leading-none">
                            Palliative Care
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-2 font-mono mt-0.5">
                          <span>MRN: {activeThread.patient.mrn}</span>
                        </div>
                      </div>
                    </div>

                    {/* View Chart Link */}
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push(
                          `/dashboard/patients/${activeThread.patient.patientId}`,
                        );
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--primary)]/30 rounded-xl text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all active:scale-95 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Chart
                    </button>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Select a conversation
                  </div>
                )}

                <button
                  onClick={() => {
                    setIsOpen(false);
                    setActiveThreadId(null);
                  }}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-xl hover:bg-[var(--input-bg)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[var(--background)] custom-scrollbar">
                {!activeThread ? (
                  <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)]">
                      <MessageCircle className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider">
                        No Active Conversation
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] max-w-xs mt-1">
                        Select a patient thread from the left panel to begin
                        secure clinical communications.
                      </p>
                    </div>
                  </div>
                ) : (
                  activeMessages?.map((m: any, idx: number) => {
                    const isSelf = m.senderRole === "navigator";
                    return (
                      <div
                        key={m.chatMessageId || idx}
                        className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                      >
                        <div className="max-w-[75%] flex flex-col">
                          <div
                            className={`flex items-center gap-1.5 mb-1 px-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] ${isSelf ? "justify-end" : "justify-start"}`}
                          >
                            <span>{isSelf ? "Care Navigator" : "Patient"}</span>
                            <span className="text-[var(--card-border)]">•</span>
                            <span className="font-mono text-[8px]">
                              {formatMessageTime(m.timestamp)}
                            </span>
                          </div>

                          <div
                            className={`p-3 rounded-2xl shadow-sm text-sm break-words font-medium leading-relaxed ${
                              isSelf
                                ? "bg-[var(--primary)] text-white rounded-tr-none"
                                : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-tl-none"
                            }`}
                          >
                            <div>{m.content}</div>
                            {isSelf && (
                              <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-80 font-semibold select-none">
                                {m.isSeen ? (
                                  <span
                                    className="text-teal-100/90 flex items-center gap-0.5"
                                    title="Read by Patient"
                                  >
                                    Read <CheckCheck className="w-3 h-3" />
                                  </span>
                                ) : (
                                  <span
                                    className="text-teal-200/70 flex items-center gap-0.5"
                                    title="Sent to Server"
                                  >
                                    Sent <Check className="w-3 h-3" />
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

              {/* Message Input & Actions */}
              {activeThread && (
                <div className="p-4 border-t border-[var(--card-border)] bg-[var(--card-bg)] flex flex-col gap-3 shrink-0">
                  {/* Quick Templates Bar */}
                  <div className="flex items-center gap-1.5 pb-1 relative shrink-0">
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                      <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20 animate-pulse" /> Templates:
                    </span>

                    {/* Scroll Left Button */}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollTemplates('left'); }}
                      className="w-5 h-5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--primary)]/30 text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center justify-center transition-all shrink-0 active:scale-90"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {/* Scrollable container */}
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

                    {/* Scroll Right Button */}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollTemplates('right'); }}
                      className="w-5 h-5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-[var(--primary)]/30 text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center justify-center transition-all shrink-0 active:scale-90"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:bg-[var(--background)] focus:ring-2 focus:ring-[var(--primary)]/35 focus:border-[var(--primary)]/55 transition-all outline-none font-medium"
                      value={inputText}
                      onChange={(e: any) => setInputText(e.target.value)}
                      onKeyDown={(e: any) => e.key === "Enter" && handleSend()}
                      placeholder="Type a secure, encrypted message..."
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputText.trim()}
                      className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 active:scale-95 disabled:opacity-50 disabled:scale-100 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send
                    </button>
                  </div>

                  {/* Secure line note */}
                  <div className="flex items-center justify-between text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-[var(--primary)]" />
                      HIPAA Secure End-to-End Encryption
                    </span>
                    <span>Audited Channel</span>
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
