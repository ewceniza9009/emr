"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Clock, AlertTriangle, Info, ShieldAlert, Zap, History as HistoryIcon } from "lucide-react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useSession } from "next-auth/react";
import * as signalR from "@microsoft/signalr";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import NotificationHistoryModal from "./NotificationHistoryModal";

const GET_NOTIFICATIONS = gql`
  query GetNotifications($count: Int) {
    notifications(count: $count) {
      notificationId
      title
      message
      priority
      isRead
      createdAt
      actionUrl
      category
    }
    unreadCount: unreadNotificationCount
  }
`;

const MARK_READ = gql`
  mutation MarkAsRead($id: UUID!) {
    markNotificationAsRead(notificationId: $id)
  }
`;

const MARK_ALL_READ = gql`
  mutation MarkAllAsRead {
    markAllNotificationsAsRead
  }
`;

interface Notification {
  notificationId: string;
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  category?: string;
}

export function NotificationCenter() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, loading, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { count: 20 },
    skip: !session,
    fetchPolicy: 'cache-and-network'
  });

  const [markAsRead] = useMutation(MARK_READ);
  const [markAllAsRead] = useMutation(MARK_ALL_READ);

  useEffect(() => {
    if (!session?.user) return;

    let isMounted = true;
    const token = (session.user as any).token;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:34732'}/hubs/notifications`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();

    connection.on("ReceiveNotification", () => {
      if (isMounted) refetch();
    });

    const startConnection = async () => {
      try {
        if (connection.state === signalR.HubConnectionState.Disconnected) {
          await connection.start();
        }
      } catch (err) {
        console.error("SignalR Notification Error: ", err);
      }
    };

    startConnection();

    return () => {
      isMounted = false;
      if (connection.state !== signalR.HubConnectionState.Disconnected) {
        connection.stop();
      }
    };
  }, [session, refetch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead({
        variables: { id },
        optimisticResponse: {
          __typename: 'Mutation',
          markNotificationAsRead: true
        }
      });
      refetch();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead({
        optimisticResponse: {
          __typename: 'Mutation',
          markAllNotificationsAsRead: true
        }
      });
      refetch();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center gap-3 px-4 h-[40px] rounded-xl transition-all active:scale-95 border group ${isOpen
            ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]'
            : 'bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]/40 shadow-sm'
          }`}
      >
        <div className="relative flex items-center justify-center">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--sidebar-bg)] shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
          )}
        </div>

        {unreadCount > 0 && (
          <span className="text-[10px] font-bold tracking-tighter">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute right-0 mt-3 w-[400px] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[100] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">Notifications</h3>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[9px] font-bold uppercase tracking-widest text-[var(--primary)] hover:opacity-80 transition-opacity"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="max-h-[480px] overflow-y-auto custom-scrollbar bg-[var(--card-bg)]">
              {loading && notifications.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Synchronizing...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-center gap-4 opacity-50">
                  <Bell className="w-10 h-10 text-[var(--text-muted)]" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">System Idle</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--card-border)]">
                  {notifications.map((notif) => (
                    <div
                      key={notif.notificationId}
                      className={`relative p-6 transition-all hover:bg-[var(--primary)]/[0.02] ${!notif.isRead ? 'bg-[var(--primary)]/[0.03]' : 'opacity-60 grayscale'}`}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all ${notif.priority === 'CRITICAL' ? 'bg-red-500' :
                          notif.priority === 'URGENT' ? 'bg-orange-500' :
                            'bg-[var(--primary)]'
                        } ${!notif.isRead ? 'opacity-100' : 'opacity-0'}`} />

                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold font-mono uppercase tracking-[0.2em] text-[var(--text-muted)]">
                            {notif.category || 'Clinical'} {"//"} {notif.notificationId.slice(0, 4)}
                          </span>
                          <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </span>
                        </div>

                        <h4 className="text-[12px] font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none">
                          {notif.title}
                        </h4>

                        <p className="text-[11px] font-medium text-[var(--text-secondary)] leading-relaxed">
                          {notif.message}
                        </p>

                        {!notif.isRead && (
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => handleMarkRead(notif.notificationId)}
                              className="px-4 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--primary)] text-[9px] font-bold uppercase tracking-widest hover:border-[var(--primary)] hover:bg-[var(--card-bg)] transition-all"
                            >
                              Mark Read
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[var(--card-border)] bg-[var(--input-bg)]/50">
              <button
                onClick={() => {
                  setIsHistoryOpen(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <HistoryIcon className="w-4 h-4" />
                History Archive
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <NotificationHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}