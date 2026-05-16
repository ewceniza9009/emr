"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronRight } from "lucide-react";

interface SmartPhrase {
  shortcut: string;
  label: string;
  templateText: string;
}

interface SmartTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  smartPhrases: SmartPhrase[];
}

export default function SmartTextarea({
  value,
  onChange,
  smartPhrases,
  className,
  ...props
}: SmartTextareaProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [phraseFilter, setPhraseFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredPhrases = smartPhrases.filter((p) =>
    p.shortcut.toLowerCase().includes(phraseFilter.toLowerCase())
  );

  useEffect(() => {
    if (selectedIndex >= filteredPhrases.length) {
      setSelectedIndex(0);
    }
  }, [filteredPhrases.length, selectedIndex]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const selectionStart = e.target.selectionStart;
    onChange(newValue);

    const textBeforeCursor = newValue.slice(0, selectionStart);
    const lastSlashIdx = textBeforeCursor.lastIndexOf("/");

    if (lastSlashIdx !== -1) {
      const segment = textBeforeCursor.slice(lastSlashIdx);
      if (segment.startsWith("/") && !segment.includes(" ")) {
        setShowPopup(true);
        setPhraseFilter(segment.slice(1));
        
        // Position popup roughly near cursor
        const textarea = e.target;
        const { offsetTop, offsetLeft } = textarea;
        
        // Simple heuristic for line height and char width
        const lines = textBeforeCursor.split("\n");
        const top = Math.min(offsetTop + lines.length * 20 + 10, offsetTop + textarea.offsetHeight - 100);
        const left = Math.min(offsetLeft + (lines[lines.length - 1].length * 8) + 10, offsetLeft + textarea.offsetWidth - 200);
        
        setPopupPosition({ top, left });
      } else {
        setShowPopup(false);
      }
    } else {
      setShowPopup(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showPopup) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredPhrases.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredPhrases.length) % Math.max(1, filteredPhrases.length));
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (filteredPhrases.length > 0) {
        e.preventDefault();
        applyPhrase(filteredPhrases[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowPopup(false);
    }
  };

  const applyPhrase = (phrase: SmartPhrase) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const textBefore = value.slice(0, cursor);
    const lastSlashIdx = textBefore.lastIndexOf("/");

    if (lastSlashIdx !== -1) {
      const newValue = value.slice(0, lastSlashIdx) + phrase.templateText + value.slice(cursor);
      onChange(newValue);
      setShowPopup(false);

      // Reset cursor position
      setTimeout(() => {
        textarea.focus();
        const newPos = lastSlashIdx + phrase.templateText.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        className={className}
        {...props}
      />

      {showPopup && filteredPhrases.length > 0 && (
        <div
          style={{ 
            position: 'absolute',
            top: `${popupPosition.top}px`, 
            left: `${popupPosition.left}px`,
            zIndex: 1000 
          }}
          className="w-64 bg-[var(--card-bg)] border border-[var(--primary)]/30 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 backdrop-blur-xl"
        >
          <div className="p-3 border-b border-[var(--card-border)] bg-[var(--primary)]/5 flex items-center justify-between">
            <p className="text-[8px] font-black text-[var(--primary)] uppercase tracking-[0.2em]">Smart Phrases</p>
            <span className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50">ESC</span>
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {filteredPhrases.map((p, idx) => (
              <div
                key={p.shortcut}
                onClick={() => applyPhrase(p)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`p-3 cursor-pointer border-b border-[var(--card-border)] last:border-0 transition-all flex flex-col ${
                  idx === selectedIndex ? "bg-[var(--primary)]/20 border-l-4 border-l-[var(--primary)]" : "hover:bg-[var(--primary)]/10"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-[9px] font-black uppercase ${idx === selectedIndex ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}>
                    {p.shortcut}
                  </span>
                  <ChevronRight className={`w-3 h-3 transition-transform ${idx === selectedIndex ? "translate-x-1 text-[var(--primary)]" : "text-[var(--text-muted)]"}`} />
                </div>
                <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest truncate">{p.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
