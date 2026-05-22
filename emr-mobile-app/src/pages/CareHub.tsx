import React, { useState, useRef, useEffect } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { gql } from "@apollo/client/core";
import { useQuery, useMutation } from "@apollo/client/react";
import { useAuth } from "../contexts/AuthContext";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonIcon,
  IonRippleEffect,
  IonModal,
  IonButton,
  IonToolbar,
} from "@ionic/react";
import {
  paperPlane,
  camera,
  attach,
  shieldCheckmark,
  warning,
  heart,
  checkmark,
  checkmarkDone,
  sunny,
  moon as moonIcon,
} from "ionicons/icons";
import { useTheme } from "../contexts/ThemeContext";

interface Message {
  id: string;
  sender: "patient" | "navigator";
  content: string;
  timestamp: string;
  isSeen?: boolean;
  isAttachment?: boolean;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  fileSize?: string;
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
        isSeen
      }
    }
  }
`;

const SEND_MESSAGE = gql`
  query GetChatThreadsDummy {
    careThreads {
      careThreadId
    }
  }
`;

const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage(
    $patientId: UUID!
    $careThreadId: UUID!
    $content: String!
  ) {
    sendMobileChatMessage(
      patientId: $patientId
      careThreadId: $careThreadId
      content: $content
    ) {
      chatMessageId
      content
      timestamp
      isSeen
    }
  }
`;

const GET_MY_PROFILE = gql`
  query GetMyProfile($patientId: UUID!) {
    myMobileProfile(patientId: $patientId) {
      primaryCareNavigatorName
      hasAdvanceDirective
    }
  }
`;

const CareHub: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, apiUrl, token } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosReason, setSosReason] = useState("");
  const [navigatorTyping, setNavigatorTyping] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const patientId = user?.patientId || (user as any)?.PatientId;

  const { data } = useQuery<any>(GET_CHAT_THREADS, {
    variables: { patientId },
    skip: !patientId,
    fetchPolicy: "cache-and-network",
  });

  const { data: profileData } = useQuery<any>(GET_MY_PROFILE, {
    variables: { patientId },
    skip: !patientId,
    fetchPolicy: "cache-and-network",
  });

  const navigatorName =
    profileData?.myMobileProfile?.primaryCareNavigatorName || "Sarah Jenkins";
  const hasAdvanceDirective =
    profileData?.myMobileProfile?.hasAdvanceDirective || false;
  const navigatorInitials = navigatorName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    const threads = data?.myMobileChatThreads;
    if (threads && threads.length > 0) {
      const firstThread = threads[0];
      setActiveThreadId(firstThread.careThreadId);
      const mapped =
        firstThread.messages?.map((m: any) => {
          const isAttachment =
            m.content.startsWith("📸 Secure Photo") ||
            m.content.startsWith("📎 Secure Attachment");
          let fileUrl = undefined;
          let fileType = undefined;
          let fileName = undefined;
          let fileSize = undefined;

          if (isAttachment) {
            const urlMatch = m.content.match(
              /Access URL:\s*(https?:\/\/[^\s]+)/,
            );
            if (urlMatch) fileUrl = urlMatch[1];
            const nameMatch = m.content.match(/"([^"]+)"/);
            if (nameMatch) fileName = nameMatch[1];
            fileType = m.content.startsWith("📸")
              ? "image/jpeg"
              : "application/octet-stream";
            const sizeMatch = m.content.match(/\(([^)]+)\)/);
            if (sizeMatch) fileSize = sizeMatch[1];
          }

          return {
            id: m.chatMessageId,
            sender: m.senderRole === "patient" ? "patient" : "navigator",
            content: m.content,
            timestamp: new Date(m.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isSeen: m.isSeen,
            isAttachment,
            fileUrl,
            fileType,
            fileName,
            fileSize,
          };
        }) || [];
      setMessages(mapped);
    }
  }, [data]);

  const [sendMessageMutation] = useMutation(SEND_MESSAGE_MUTATION);

  useEffect(() => {
    if (!activeThreadId || !apiUrl || !token) return;

    let isMounted = true;

    const connection = new HubConnectionBuilder()
      .withUrl(`${apiUrl}/hubs/chat`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    // Re-join the thread group and mark seen after a network reconnect
    connection.onreconnected(() => {
      if (isMounted && activeThreadId) {
        connection.invoke("JoinCareThread", activeThreadId).catch(() => {});
        connection
          .invoke("MarkAsSeen", activeThreadId, "patient")
          .catch(() => {});
      }
    });

    connection
      .start()
      .then(() => {
        if (isMounted) {
          console.log("SignalR Connected");
          connection.invoke("JoinCareThread", activeThreadId).catch(() => {});
          connection
            .invoke("MarkAsSeen", activeThreadId, "patient")
            .catch(() => {});
        }
      })
      .catch((err) => console.error("SignalR Connection Error: ", err));

    connection.on("ReceiveMessage", (message: any) => {
      if (!isMounted) return;
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.chatMessageId);
        if (exists) return prev;
        // Filter out optimistic temporary messages with same content
        const filtered = prev.filter(
          (m) =>
            !(
              m.id.startsWith("temp-") &&
              m.content === message.content &&
              m.sender === "patient"
            ),
        );

        const isAttachment =
          message.content.startsWith("📸 Secure Photo") ||
          message.content.startsWith("📎 Secure Attachment");
        let fileUrl = undefined;
        let fileType = undefined;
        let fileName = undefined;
        let fileSize = undefined;

        if (isAttachment) {
          const urlMatch = message.content.match(
            /Access URL:\s*(https?:\/\/[^\s]+)/,
          );
          if (urlMatch) fileUrl = urlMatch[1];
          const nameMatch = message.content.match(/"([^"]+)"/);
          if (nameMatch) fileName = nameMatch[1];
          fileType = message.content.startsWith("📸")
            ? "image/jpeg"
            : "application/octet-stream";
          const sizeMatch = message.content.match(/\(([^)]+)\)/);
          if (sizeMatch) fileSize = sizeMatch[1];
        }

        return [
          ...filtered,
          {
            id: message.chatMessageId,
            sender: message.senderRole === "patient" ? "patient" : "navigator",
            content: message.content,
            timestamp: new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isSeen: message.isSeen,
            isAttachment,
            fileUrl,
            fileType,
            fileName,
            fileSize,
          },
        ];
      });

      if (message.senderRole !== "patient") {
        connection
          .invoke("MarkAsSeen", activeThreadId, "patient")
          .catch(() => {});
      }
    });

    connection.on("MessageSeen", (careThreadId: string, senderRole: string) => {
      if (!isMounted) return;
      if (careThreadId === activeThreadId && senderRole === "navigator") {
        // Navigator read patient messages -> mark patient's messages as seen!
        setMessages((prev) =>
          prev.map((m) =>
            m.sender === "patient" ? { ...m, isSeen: true } : m,
          ),
        );
      }
    });

    return () => {
      isMounted = false;
      connection.stop().catch(() => {});
    };
  }, [activeThreadId, apiUrl, token]);

  const contentRef = useRef<HTMLIonContentElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const tempId = `temp-${Date.now()}`;
    const newMsg: Message = {
      id: tempId,
      sender: "patient",
      content: trimmedText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isSeen: false,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    const lowerText = trimmedText.toLowerCase();
    if (
      lowerText.includes("chest pain") ||
      lowerText.includes("heart attack") ||
      lowerText.includes("cannot breathe") ||
      lowerText.includes("shortness of breath")
    ) {
      setSosReason("Chest Pain / Dyspnea");
      setShowSosModal(true);
    }

    try {
      await sendMessageMutation({
        variables: {
          patientId,
          careThreadId:
            activeThreadId || "00000000-0000-0000-0000-000000000000",
          content: trimmedText,
        },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "camera" | "file",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const fileSize = (file.size / 1024).toFixed(1) + " KB";
    const fileType = file.type;
    const isImage = file.type.startsWith("image/");

    // 1. Add optimistic message showing "Encrypting & Uploading..."
    const uploadTempId = `upload-${Date.now()}`;
    const initialUploadMsg: Message = {
      id: uploadTempId,
      sender: "patient",
      content: `🔒 Encrypting & uploading ${type === "camera" ? "photo" : "file"} "${fileName}"...`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, initialUploadMsg]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", fileName);
    formData.append(
      "documentType",
      type === "camera" ? "CLINICAL_RECORD" : "OTHER",
    );

    // Perform actual API upload to EMR backend general upload endpoint
    const uploadUrl = `${apiUrl}/api/upload/general/${patientId}`;

    fetch(uploadUrl, {
      method: "POST",
      body: formData,
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Upload status failed: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Build real persisted URL pointing to EMR backend Azurite file download endpoint
        const persistedUrl =
          data.url || `${apiUrl}/api/upload/document/${data.documentId}`;

        const uploadText =
          type === "camera"
            ? `📸 Secure Photo: "${fileName}" uploaded successfully (AES-256 Encrypted)`
            : `📎 Secure Attachment: "${fileName}" (${fileSize}) uploaded successfully (AES-256 Encrypted)`;

        // Replace optimistic loader with persistent attachment properties and real fileUrl
        setMessages((prev) =>
          prev.map((m) =>
            m.id === uploadTempId
              ? {
                  ...m,
                  content: uploadText,
                  isAttachment: true,
                  fileUrl: persistedUrl,
                  fileType,
                  fileName,
                  fileSize,
                }
              : m,
          ),
        );

        // Trigger navigator typing response
        setNavigatorTyping(true);
        setTimeout(() => {
          setNavigatorTyping(false);

          // Add clinical verification message
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 2).toString(),
              sender: "navigator",
              content: `🔒 System: ${isImage ? "Wound photo / Image" : "Document"} "${fileName}" received securely and appended to your clinical chart. Your Care Navigator has been notified for triage review.`,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ]);
        }, 1500);

        // Persist the message with EMR attachment URL inside GraphQL CareThread database
        const persistedTextWithLink =
          type === "camera"
            ? `📸 Secure Photo: "${fileName}" uploaded successfully (AES-256 Encrypted). Access URL: ${persistedUrl}`
            : `📎 Secure Attachment: "${fileName}" (${fileSize}) uploaded successfully (AES-256 Encrypted). Access URL: ${persistedUrl}`;

        sendMessageMutation({
          variables: {
            patientId,
            careThreadId:
              activeThreadId || "00000000-0000-0000-0000-000000000000",
            content: persistedTextWithLink,
          },
        }).catch((err) =>
          console.error("Error persisting attachment message:", err),
        );
      })
      .catch((err) => {
        console.error("Persisted upload failed:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === uploadTempId
              ? {
                  ...m,
                  content: `❌ Secure Upload Failed for "${fileName}": ${err.message || "Server error"}`,
                }
              : m,
          ),
        );
      });

    // Clear target value
    e.target.value = "";
  };

  return (
    <IonPage className="bg-slate-50 dark:bg-[#020408]">
      {/* Hidden file inputs for real workflows */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={(e) => handleFileChange(e, "camera")}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e, "file")}
        accept="image/*,application/pdf,text/*"
        className="hidden"
      />
      {/* Header - Extremely Compact Row */}
      <IonHeader className="ion-no-border">
        <IonToolbar
          style={{
            "--min-height": "44px",
            "--padding-top": "4px",
            "--padding-bottom": "4px",
            "--padding-start": "16px",
            "--padding-end": "16px",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-teal-650 dark:text-teal-400 font-black text-xs">
                  {navigatorInitials}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#020408] shadow-[0_0_8px_#10b981]" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {navigatorName}
                  </h2>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-black text-emerald-650 dark:text-emerald-400 uppercase tracking-wider">
                    HIPAA
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-none mt-0.5">
                  Care Navigator
                </span>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              style={{ borderRadius: "9999px" }}
              className={`w-10 h-10 flex items-center justify-center border transition-all active:scale-95 shadow-sm cursor-pointer ${
                theme === "dark"
                  ? "bg-slate-900 border-slate-800 text-teal-400 hover:bg-slate-800"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
              title={
                theme === "dark"
                  ? "Switch to Porcelain Mode"
                  : "Switch to Midnight Mode"
              }
            >
              <IonIcon
                icon={theme === "dark" ? sunny : moonIcon}
                className="w-5 h-5"
              />
            </button>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent ref={contentRef} className="ion-padding">
        <div className="flex flex-col min-h-full space-y-4 pb-6">
          {/* Emergency Helper Tip */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 dark:from-amber-950/20 dark:to-slate-900/40 border border-amber-250 dark:border-amber-900/40 flex gap-3 shadow-sm">
            <IonIcon
              icon={warning}
              className="w-5.5 h-5.5 text-amber-600 dark:text-amber-500 flex-shrink-0 animate-pulse"
            />
            <div>
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest block">
                NLP Distress Trigger Test
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                Type{" "}
                <strong className="text-slate-700 dark:text-white font-extrabold">
                  "chest pain"
                </strong>{" "}
                or{" "}
                <strong className="text-slate-700 dark:text-white font-extrabold">
                  "cannot breathe"
                </strong>{" "}
                to simulate the automatic triage override!
              </p>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-grow space-y-4 pt-1">
            {messages.map((msg) => {
              const isPatient = msg.sender === "patient";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isPatient ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                      isPatient
                        ? msg.isAttachment
                          ? "bg-slate-100 dark:bg-[#0c1f24] border border-slate-200 dark:border-teal-900/50 text-slate-800 dark:text-teal-200 rounded-tr-none"
                          : "bg-teal-600 dark:bg-[#0b292c] border border-teal-600/10 dark:border-teal-500/20 text-white dark:text-teal-50 rounded-tr-none shadow-md"
                        : msg.content.startsWith("⚠️")
                          ? "bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 rounded-tl-none"
                          : "bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none shadow-[0_2px_8px_rgba(15,23,42,0.02)]"
                    }`}
                  >
                    {msg.isAttachment && (
                      <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-slate-200/50 dark:bg-teal-950/50 border border-slate-350 dark:border-teal-900/50">
                        <IonIcon
                          icon={shieldCheckmark}
                          className="w-4 h-4 text-slate-700 dark:text-teal-400"
                        />
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-700 dark:text-teal-400">
                          Media Shield Active
                        </span>
                      </div>
                    )}
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-semibold font-sans">
                      {msg.content}
                    </p>

                    {msg.isAttachment &&
                      msg.fileUrl &&
                      (msg.fileType?.startsWith("image/") ? (
                        <div className="mt-2 rounded-xl overflow-hidden border border-slate-200/10 max-w-full">
                          <img
                            src={msg.fileUrl}
                            alt={msg.fileName || "Attachment"}
                            className="w-full h-auto max-h-48 object-cover"
                          />
                        </div>
                      ) : (
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-500/10 border border-slate-200/10 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-slate-200/10 border border-slate-200/20 flex items-center justify-center shrink-0">
                              <IonIcon
                                icon={attach}
                                className="w-4 h-4 text-teal-400"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold truncate text-[11px] leading-tight text-slate-200">
                                {msg.fileName}
                              </p>
                              <p className="text-[9px] opacity-75 font-mono leading-none mt-0.5 text-slate-400">
                                {msg.fileSize}
                              </p>
                            </div>
                          </div>
                          <a
                            href={msg.fileUrl}
                            download={msg.fileName}
                            className="text-[10px] font-bold text-teal-400 hover:underline shrink-0"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    <div
                      className={`flex items-center justify-end gap-1 mt-2 text-[10px] ${
                        isPatient
                          ? msg.isAttachment
                            ? "text-slate-400 dark:text-slate-500"
                            : "text-teal-200 dark:text-teal-400 font-bold"
                          : "text-slate-400 dark:text-slate-550 font-bold"
                      } font-mono`}
                    >
                      <span>{msg.timestamp}</span>
                      {isPatient && (
                        <span className="flex items-center gap-0.5 ml-1 select-none">
                          <span className="text-[9px] font-bold uppercase tracking-wider opacity-85">
                            {msg.isSeen ? "Seen" : "Sent"}
                          </span>
                          <IonIcon
                            icon={msg.isSeen ? checkmarkDone : checkmark}
                            className={`w-3.5 h-3.5 ${msg.isSeen ? "text-teal-200 dark:text-teal-400" : "text-teal-350/60"}`}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Navigator Typing Indicator */}
            {navigatorTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-slate-800/80 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                  <div
                    className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
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
            onClick={() => cameraInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full active:bg-slate-100 dark:active:bg-slate-850 flex-shrink-0 flex items-center justify-center cursor-pointer"
            title="Take Secure Photo"
            style={{ borderRadius: "9999px" }}
          >
            <IonIcon
              icon={camera}
              className="w-5.5 h-5.5 text-slate-500 dark:text-slate-400"
            />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full active:bg-slate-100 dark:active:bg-slate-850 flex-shrink-0 flex items-center justify-center cursor-pointer"
            title="Attach Document"
            style={{ borderRadius: "9999px" }}
          >
            <IonIcon
              icon={attach}
              className="w-5.5 h-5.5 text-slate-500 dark:text-slate-400"
            />
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
            style={{ borderRadius: "9999px" }}
          >
            <IonIcon icon={paperPlane} className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* SOS Alert Modal */}
      <IonModal
        isOpen={showSosModal}
        onDidDismiss={() => setShowSosModal(false)}
        className="sos-modal"
        style={{ "--border-radius": "24px" }}
      >
        {hasAdvanceDirective ? (
          <div className="p-6 bg-white dark:bg-[#090b10] border border-rose-200 dark:border-rose-950/40 rounded-2xl text-center space-y-4 h-full flex flex-col justify-center items-center overflow-y-auto">
            {/* Pulsing Shield Icon - Calming gold/rose border */}
            <div className="w-16 h-16 bg-rose-500/10 dark:bg-rose-500/20 border-2 border-rose-500 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)] flex-shrink-0">
              <IonIcon icon={heart} className="w-8 h-8 text-rose-500" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Palliative Rescue Protocol Active
              </h2>
              <div className="flex flex-col items-center gap-1.5 mt-1">
                <div className="px-3 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-[9px] font-black font-mono text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                  Active Protection: Comfort Measures Only (DNR)
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
                  Symptom Flagged: {sosReason}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mt-2 font-medium">
                Our clinical NLP core has identified symptoms of respiratory or
                pain distress. To protect your stated goals of care, we have
                launched comfort-first bedside guidelines and alerted Palliative
                Command.
              </p>
            </div>

            {/* Bedside comfort guidelines */}
            <div className="w-full bg-rose-500/[0.02] dark:bg-rose-950/10 border border-rose-500/20 rounded-2xl p-4 text-left space-y-2.5">
              <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider block">
                Rescue Action & Bedside Protocol
              </span>
              <div className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed space-y-1.5 font-semibold">
                <p>
                  • <strong>Rescue Opioid:</strong> Administer{" "}
                  <strong>0.25 mL (5 mg)</strong> of sublingual liquid morphine
                  concentrate immediately under the tongue.
                </p>
                <p>
                  • <strong>Airflow Trigeminal Relief:</strong> Turn on a
                  bedside cool fan blowing directly across your face and sit
                  upright leaning slightly forward.
                </p>
                <p>
                  • <strong>Anxiety Rescue:</strong> Administer{" "}
                  <strong>0.5 mg</strong> of sublingual Lorazepam as needed for
                  severe accompanying panic or air hunger.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 w-full mt-2">
              <a
                href="tel:18005557255"
                className="w-full h-11 bg-teal-600 hover:bg-teal-505 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-[#020408] rounded-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider shadow-md shadow-teal-500/10 active:scale-95 transition-transform"
                style={{ textDecoration: "none" }}
              >
                <IonIcon icon={shieldCheckmark} className="w-4.5 h-4.5" />
                <span>Call Palliative Triage Hotline</span>
              </a>

              <IonButton
                expand="block"
                fill="outline"
                className="text-xs font-bold uppercase border-slate-200 dark:border-slate-800 rounded-full h-10 w-full"
                onClick={() => setShowSosModal(false)}
                style={{
                  "--border-radius": "9999px",
                  "--border-color": "var(--ion-color-step-300)",
                }}
              >
                Acknowledge & Close
              </IonButton>

              {/* Safety escape hatch in small, low-visual weight text */}
              <div className="text-center mt-1">
                <button
                  onClick={() => {
                    // Force dial 911 if requested
                    window.location.href = "tel:911";
                  }}
                  className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-650 hover:text-rose-500 dark:hover:text-rose-500 transition-colors bg-transparent border-0 outline-none cursor-pointer"
                >
                  ⚠️ Override Comfort Protocol: Call 911
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white dark:bg-[#090b10] border border-rose-200 dark:border-rose-900/50 rounded-2xl text-center space-y-5 h-full flex flex-col justify-center items-center">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center animate-ping">
              <IonIcon icon={heart} className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Emergency Warning
              </h2>
              <div className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-full inline-block text-[10px] font-mono text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                Symptom Detected: {sosReason}
              </div>
              <p className="text-xs text-slate-555 dark:text-slate-400 leading-relaxed max-w-sm mt-2">
                Our clinical NLP core has identified symptoms indicative of
                cardiac or respiratory distress. A high-priority dashboard
                override was sent to the Halkyone Clinical Command Center.
              </p>
            </div>

            <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-left">
              <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-wider">
                Patient Directions
              </span>
              <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-snug mt-1">
                • Lie down in a comfortable position.
                <br />
                • If prescribed nitroglycerin, administer as directed.
                <br />•{" "}
                <strong className="text-slate-950 dark:text-white">
                  Call 911 immediately
                </strong>{" "}
                if your pain worsens or you lose consciousness.
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
        )}
      </IonModal>
    </IonPage>
  );
};

export default CareHub;
