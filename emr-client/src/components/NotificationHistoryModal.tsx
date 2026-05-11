"use client";

import { X, Bell, Check, Clock, AlertTriangle, Info, ShieldAlert, History as HistoryIcon } from "lucide-react";
import { useQuery, gql } from "@apollo/client";
import { formatDistanceToNow } from "date-fns";
import HalcyonPortal from "./Portal";
import { motion, AnimatePresence } from "framer-motion";

const GET_ALL_NOTIFICATIONS = gql`
  query GetAllNotifications($count: Int) {
    notifications(count: $count) {
      notificationId
      title
      message
      priority
      isRead
      createdAt
      category
    }
  }
`;

interface Notification {
  notificationId: string;
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
  isRead: boolean;
  createdAt: string;
  category?: string;
}

interface NotificationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationHistoryModal({ isOpen, onClose }: NotificationHistoryModalProps) {
  const { data, loading } = useQuery(GET_ALL_NOTIFICATIONS, {
    variables: { count: 100 },
    skip: !isOpen,
    fetchPolicy: 'network-only'
  });

  if (!isOpen) return null;

  const notifications: Notification[] = data?.notifications || [];

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'URGENT': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'HIGH': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return <ShieldAlert className="w-4 h-4" />;
      case 'URGENT': return <AlertTriangle className="w-4 h-4" />;
      case 'HIGH': return <Info className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
                <HistoryIcon className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">Notification History</h2>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">
                  Full audit of your clinical alerts and system messages
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all hover:scale-110 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-3 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Retrieving Archives...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center gap-4 opacity-50">
                <Bell className="w-12 h-12 text-[var(--text-muted)]" />
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-[var(--text-primary)]">Archive Empty</p>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] mt-1">No historical notifications found.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div 
                    key={notif.notificationId}
                    className={`p-5 rounded-2xl border transition-all ${notif.isRead ? 'bg-[var(--input-bg)]/50 border-[var(--card-border)] opacity-60' : 'bg-[var(--primary)]/5 border-[var(--primary)]/20 shadow-lg shadow-[var(--primary)]/5'}`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${getPriorityStyles(notif.priority)}`}>
                        {getPriorityIcon(notif.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--primary)]">
                            {notif.category || 'Clinical'}
                          </span>
                          <span className="text-[9px] font-bold text-[var(--text-muted)]">
                            {new Date(notif.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="text-[12px] font-black uppercase tracking-tight text-[var(--text-primary)]">
                          {notif.title}
                        </h4>
                        <p className="text-[11px] font-medium text-[var(--text-secondary)] mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-[var(--card-border)] bg-[var(--input-bg)]/30 flex justify-end">
            <button 
              onClick={onClose}
              className="px-8 py-2.5 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--primary)]/20 hover:scale-105 transition-transform"
            >
              Acknowledge
            </button>
          </div>
        </motion.div>
      </div>
    </HalcyonPortal>
  );
}
