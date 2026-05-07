"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught clinical error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="glass-morphism max-w-lg w-full rounded-[2.5rem] border border-red-500/20 p-12 text-center space-y-8 shadow-2xl shadow-red-500/10">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mx-auto border border-red-500/20">
               <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">System Interruption</h1>
              <p className="text-slate-400">An unexpected error occurred in the clinical module. Patient safety data has been preserved, but the view needs to be reset.</p>
            </div>
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 text-xs font-mono text-red-400/80 text-left overflow-auto max-h-[100px]">
               {this.state.error?.message}
            </div>
            <div className="flex gap-4">
               <button 
                 onClick={() => window.location.reload()}
                 className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-bold border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
               >
                 <RefreshCcw className="w-4 h-4" /> Reload System
               </button>
               <button 
                 onClick={() => window.location.href = '/dashboard'}
                 className="flex-1 py-4 rounded-2xl premium-gradient text-white font-bold shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
               >
                 <Home className="w-4 h-4" /> Return to Hub
               </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

