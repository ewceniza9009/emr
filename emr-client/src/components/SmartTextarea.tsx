"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronRight } from "lucide-react";

interface SmartPhrase {
  shortcut: string;
  label: string;
  templateText: string;
}

// Helper function to get caret coordinates inside textarea
function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  const div = document.createElement("div");
  const style = window.getComputedStyle(element);
  
  const properties = [
    "direction", "boxSizing", "width", "height", "overflowX", "overflowY",
    "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
    "borderStyle", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
    "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize",
    "lineHeight", "fontFamily", "textAlign", "textTransform", "textIndent",
    "textDecoration", "letterSpacing", "wordSpacing"
  ];

  properties.forEach(prop => {
    (div.style as any)[prop] = (style as any)[prop];
  });

  div.style.position = "absolute";
  div.style.visibility = "hidden";
  div.style.whiteSpace = "pre-wrap";
  div.style.wordWrap = "break-word";
  
  const borderLeft = parseFloat(style.borderLeftWidth || "0");
  const borderTop = parseFloat(style.borderTopWidth || "0");
  
  div.style.width = `${element.clientWidth}px`;

  div.textContent = element.value.substring(0, position);

  const span = document.createElement("span");
  span.textContent = element.value.substring(position, position + 1) || ".";
  div.appendChild(span);

  document.body.appendChild(div);
  
  const top = span.offsetTop + borderTop - element.scrollTop;
  const left = span.offsetLeft + borderLeft - element.scrollLeft;

  document.body.removeChild(div);
  return { top, left };
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
  const listRef = useRef<HTMLDivElement>(null);

  // Smart Phrase History tracking for instant clinical rollbacks
  const [lastValue, setLastValue] = useState<string | null>(null);
  const [lastCursor, setLastCursor] = useState<number | null>(null);
  const [showUndoBanner, setShowUndoBanner] = useState(false);

  const filteredPhrases = smartPhrases.filter((p) =>
    p.shortcut.toLowerCase().includes(phraseFilter.toLowerCase())
  );

  // Auto-scroll selected item into view during arrow key navigation
  useEffect(() => {
    if (!listRef.current) return;
    const container = listRef.current;
    const activeItem = container.children[selectedIndex] as HTMLElement;
    if (!activeItem) return;

    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;
    const elemTop = activeItem.offsetTop;
    const elemBottom = elemTop + activeItem.offsetHeight;

    if (elemTop < containerTop) {
      container.scrollTop = elemTop;
    } else if (elemBottom > containerBottom) {
      container.scrollTop = elemBottom - container.clientHeight;
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (selectedIndex >= filteredPhrases.length) {
      setSelectedIndex(0);
    }
  }, [filteredPhrases.length, selectedIndex]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const selectionStart = e.target.selectionStart;
    onChange(newValue);

    // Fade out undo toast as soon as clinician resumes typing or editing
    if (showUndoBanner) {
      setShowUndoBanner(false);
    }

    const textBeforeCursor = newValue.slice(0, selectionStart);
    const lastSlashIdx = textBeforeCursor.lastIndexOf("/");

    if (lastSlashIdx !== -1) {
      const segment = textBeforeCursor.slice(lastSlashIdx);
      if (segment.startsWith("/") && !segment.includes(" ")) {
        setShowPopup(true);
        setPhraseFilter(segment.slice(1));
        
        const textarea = e.target;
        const coords = getCaretCoordinates(textarea, selectionStart);
        setPopupPosition({
          top: coords.top + 24,
          left: Math.min(coords.left, textarea.clientWidth - 270)
        });
      } else {
        setShowPopup(false);
      }
    } else {
      setShowPopup(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (!showPopup) return;
    const textarea = textareaRef.current;
    if (textarea) {
      const selectionStart = textarea.selectionStart;
      const textBeforeCursor = textarea.value.slice(0, selectionStart);
      const lastSlashIdx = textBeforeCursor.lastIndexOf("/");
      if (lastSlashIdx !== -1) {
        const coords = getCaretCoordinates(textarea, selectionStart);
        setPopupPosition({
          top: coords.top + 24,
          left: Math.min(coords.left, textarea.clientWidth - 270)
        });
      }
    }
  };

  const handleUndo = () => {
    if (lastValue === null) return;
    onChange(lastValue);
    const pos = lastCursor ?? 0;
    setLastValue(null);
    setLastCursor(null);
    setShowUndoBanner(false);

    // Re-focus and put caret exactly where the slash '/' was
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Intercept Ctrl + Z or Cmd + Z undo key combinations specifically for smartphrase rollback
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      if (lastValue !== null) {
        e.preventDefault();
        handleUndo();
        return;
      }
    }

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
      // Record history state prior to template expansion
      setLastValue(value);
      setLastCursor(cursor);
      setShowUndoBanner(true);

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
        onScroll={handleScroll}
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
          <div ref={listRef} className="relative max-h-48 overflow-y-auto custom-scrollbar">
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

      {/* Floating Glassmorphic Undo Action Indicator */}
      {showUndoBanner && (
        <div className="absolute bottom-3 right-3 z-50 flex items-center gap-2 bg-[#090d16]/90 border border-emerald-500/30 rounded-xl px-3 py-1.5 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
            Template Inserted
          </span>
          <div className="h-3 w-[1px] bg-slate-805/40 mx-1" />
          <button
            type="button"
            onClick={handleUndo}
            className="text-[9px] font-black uppercase text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent border-none outline-none p-0"
          >
            <span>Undo</span>
            <kbd className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded text-[8px] font-bold font-sans uppercase">
              Ctrl+Z
            </kbd>
          </button>
          <button
            type="button"
            onClick={() => setShowUndoBanner(false)}
            className="text-[9px] font-bold text-slate-500 hover:text-slate-300 ml-1.5 bg-transparent border-none outline-none cursor-pointer p-0"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
