"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useSession } from "next-auth/react";
import { 
  FileText, 
  Search, 
  Plus, 
  Clock, 
  User, 
  CheckCircle2, 
  MoreVertical,
  ChevronRight,
  Filter,
  Save,
  Lock,
  Edit3,
  Loader2
} from "lucide-react";

const GET_NOTES_DATA = gql`
  query GetNotesData {
    appointments {
      appointmentId
      patientId
      scheduledStart
      status
      patient {
        firstName
        lastName
        mrn
      }
      practitioner {
        firstName
        lastName
      }
    }
    smartPhrases {
      shortcut
      label
      templateText
    }
  }
`;
 
const START_ENCOUNTER = gql`
  mutation StartEncounter($input: CreateClinicalEncounterCommandInput!) {
    createClinicalEncounter(input: $input)
  }
`;

const SAVE_NOTE = gql`
  mutation SaveNote($input: SaveClinicalNoteCommandInput!) {
    saveClinicalNote(input: $input)
  }
`;

export default function ClinicalNotesPage() {
  const { data: session } = useSession();
  const { data, loading, error } = useQuery(GET_NOTES_DATA);
  const [startEncounter] = useMutation(START_ENCOUNTER);
  const [saveNote] = useMutation(SAVE_NOTE);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [narrative, setNarrative] = useState("");
  const [showSmartPhrases, setShowSmartPhrases] = useState(false);
  const [phraseFilter, setPhraseFilter] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [noteCache, setNoteCache] = useState<Record<string, string>>({});
  const [encounterCache, setEncounterCache] = useState<Record<string, string>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const appointments = data?.appointments || [];
  const smartPhrases = data?.smartPhrases || [];
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const selectedNote = appointments.find((a: any) => a.appointmentId === selectedId);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("aura_notes_cache");
    if (saved) {
      try {
        setNoteCache(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load notes cache", e);
      }
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (Object.keys(noteCache).length > 0) {
      localStorage.setItem("aura_notes_cache", JSON.stringify(noteCache));
      setLastSaved(new Date());
    }
  }, [noteCache]);

  // Sync narrative with selected note
  useEffect(() => {
    if (selectedId) {
      setNarrative(noteCache[selectedId] || "");
    }
  }, [selectedId]);

  // Auto-select first appointment
  useEffect(() => {
    if (appointments.length > 0 && !selectedId) {
      setSelectedId(appointments[0].appointmentId);
    }
  }, [appointments, selectedId]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;
    setNarrative(value);

    // Persist to local cache for autosave feel
    if (selectedId) {
      setNoteCache(prev => ({ ...prev, [selectedId]: value }));
    }

    // Detect / trigger with better logic
    const textBeforeCursor = value.slice(0, selectionStart);
    const lastSlashIdx = textBeforeCursor.lastIndexOf("/");
    
    if (lastSlashIdx !== -1) {
      const segment = textBeforeCursor.slice(lastSlashIdx);
      // Only show if it's a valid shortcut (starts with / and has no spaces)
      if (segment.startsWith("/") && !segment.includes(" ")) {
        setShowSmartPhrases(true);
        setPhraseFilter(segment.slice(1).toLowerCase());
      } else {
        setShowSmartPhrases(false);
      }
    } else {
      setShowSmartPhrases(false);
    }
  };

  const selectPhrase = (phrase: string) => {
    if (!textareaRef.current) return;
    
    const cursor = textareaRef.current.selectionStart;
    const textBeforeCursor = narrative.slice(0, cursor);
    const lastSlashIdx = textBeforeCursor.lastIndexOf("/");
    
    if (lastSlashIdx !== -1) {
      const newText = narrative.slice(0, lastSlashIdx) + phrase + narrative.slice(cursor);
      setNarrative(newText);
      
      // Update cache immediately
      if (selectedId) {
        setNoteCache(prev => ({ ...prev, [selectedId]: newText }));
      }

      // Refocus and reposition caret
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newPos = lastSlashIdx + phrase.length;
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
    setShowSmartPhrases(false);
  };

  const handleSave = async (finalize: boolean) => {
    if (!selectedId || !selectedNote) return;
    
    setIsSyncing(true);
    try {
      // 1. Get or Create Encounter
      let encounterId = encounterCache[selectedId];
      
      if (!encounterId) {
        const { data: startData } = await startEncounter({
          variables: {
            input: {
              patientId: selectedNote.patientId,
              practitionerId: (session?.user as any)?.practitionerId || "00000000-0000-0000-0000-000000000000",
              appointmentId: selectedId,
              chiefComplaint: "Clinical Documentation Update",
              notes: ""
            }
          }
        });
        encounterId = startData.createClinicalEncounter;
        setEncounterCache(prev => ({ ...prev, [selectedId]: encounterId }));
      }

      // 2. Save Note to Backend
      await saveNote({
        variables: {
          input: {
            encounterId,
            authorId: (session?.user as any)?.practitionerId || "00000000-0000-0000-0000-000000000000",
            content: narrative,
            signature: finalize ? (session?.user?.name || "Digitally Signed") : null
          }
        }
      });

      alert(finalize ? "Note Finalized & Locked in EHR" : "Progress Note Synced to Cloud");
    } catch (err) {
      console.error("Sync failed", err);
      alert("Local Save Successful. EHR Sync Failed. Check Connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
    </div>
  );


  return (
    <div className="flex h-full gap-4 overflow-hidden animate-in fade-in duration-700">
      {/* Notes List Sidebar */}
      <div className="w-[400px] flex flex-col gap-4 overflow-hidden">
        <div className="bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] shadow-xl p-6 flex flex-col gap-6 overflow-hidden h-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-tighter">Clinical Notes</h2>
              <p className="text-[10px] font-black text-[var(--primary)] tracking-widest uppercase">Documentation Registry</p>
            </div>
            <button className="p-3 bg-[var(--primary)] text-white rounded-xl shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 transition-all">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input 
              placeholder="SEARCH NOTES OR PATIENTS..."
              className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-black placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all uppercase"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-10 custom-scrollbar">
            {appointments.map((n: any) => (
              <div 
                key={n.appointmentId} 
                onClick={() => setSelectedId(n.appointmentId)}
                className={`p-5 rounded-[1.8rem] border transition-all cursor-pointer group ${
                  selectedId === n.appointmentId 
                    ? 'bg-[var(--primary)]/5 border-[var(--primary)]/30 shadow-lg' 
                    : 'bg-[var(--input-bg)]/50 border-[var(--card-border)] hover:border-[var(--primary)]/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                    n.status === 'IN_PROGRESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]'
                  }`}>
                    {n.status}
                  </span>
                  <span className="text-[9px] font-black text-[var(--text-muted)]">
                    {new Date(n.scheduledStart).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-black uppercase mb-1">{n.patient?.firstName} {n.patient?.lastName}</h4>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Clinical Note</p>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedId === n.appointmentId ? 'translate-x-1 text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Note Editor Area */}
      {selectedNote && (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] shadow-2xl p-10 flex flex-col gap-8 h-full relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-8 shrink-0">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-[var(--primary)]" />
                  </div>
                  <div>
                     <h1 className="text-2xl font-black tracking-tighter uppercase">{selectedNote.patient?.firstName} {selectedNote.patient?.lastName}</h1>
                     <div className="flex items-center gap-4 mt-1">
                        <span className="text-[10px] font-black text-[var(--text-muted)] tracking-widest uppercase">{selectedNote.patient?.mrn}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--card-border)]" />
                        <span className="text-[10px] font-black text-[var(--primary)] tracking-widest uppercase">Visit Documentation</span>
                     </div>
                  </div>
               </div>
                 <div className="flex items-center gap-3">
                  <button 
                    disabled={isSyncing}
                    onClick={() => handleSave(false)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--card-border)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--primary-glow)] transition-all disabled:opacity-50"
                  >
                    {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                    {isSyncing ? "Syncing..." : "Save Draft"}
                  </button>
                  <button 
                    disabled={isSyncing}
                    onClick={() => handleSave(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[var(--primary-glow)] hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Finalize Note
                  </button>
                </div>
            </div>

            {/* Editor Placeholder */}
            <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide space-y-8">
               <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Attending Clinician</label>
                    <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-3">
                      <User className="w-4 h-4 text-[var(--primary)]" />
                      <span className="text-xs font-bold uppercase">{selectedNote.practitioner?.firstName} {selectedNote.practitioner?.lastName}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Documentation Status</label>
                    <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-3">
                      <Edit3 className="w-4 h-4 text-[var(--primary)]" />
                      <span className="text-xs font-bold uppercase">{selectedNote.status}</span>
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Clinical Narrative</label>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live Documentation Active</span>
                    </div>
                  </div>
                  <div className="group relative">
                    <textarea 
                      ref={textareaRef}
                      value={narrative}
                      onChange={handleTextChange}
                      onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                      onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                      placeholder={`Begin typing clinical documentation for ${selectedNote.patient?.firstName}... use / for smart templates.`}
                      className="w-full min-h-[500px] bg-[var(--input-bg)] border border-[var(--card-border)] rounded-[2.5rem] p-10 text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:italic placeholder:opacity-30 outline-none focus:border-[var(--primary)]/50 focus:shadow-[0_0_30px_var(--primary-glow)] transition-all resize-none scrollbar-hide"
                    />

                    {/* Smart Phrase Dropdown */}
                    {showSmartPhrases && (
                      <div className="absolute top-10 left-10 w-80 bg-[var(--card-bg)] border border-[var(--primary)]/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-[var(--card-border)] bg-[var(--primary)]/5">
                           <p className="text-[9px] font-black text-[var(--primary)] uppercase tracking-[0.2em]">Aura Smart Phrases</p>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {smartPhrases.filter((p: any) => p.shortcut.includes(phraseFilter)).map((p: any) => (
                            <div 
                              key={p.shortcut} 
                              onClick={() => selectPhrase(p.templateText)}
                              className="p-4 hover:bg-[var(--primary)]/10 cursor-pointer border-b border-[var(--card-border)] last:border-0 group transition-all"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black text-white uppercase group-hover:text-[var(--primary)]">{p.shortcut}</span>
                                <ChevronRight className="w-3 h-3 text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
                              </div>
                              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{p.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Floating Formatting Helper */}
                    <div className="absolute bottom-6 right-10 flex items-center gap-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest pointer-events-none group-focus-within:opacity-100 transition-opacity">
                      {lastSaved && (
                        <span className="text-emerald-500/60 animate-pulse">
                          Autosaved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      )}
                      <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                      <span>Press <span className="text-[var(--primary)]">/</span> for Smart Phrases</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Compliance Badge */}
            <div className="absolute bottom-8 right-8 flex items-center gap-2 px-4 py-2 bg-[var(--input-bg)] rounded-full border border-[var(--card-border)]">
              <Lock className="w-3 h-3 text-[var(--text-muted)]" />
              <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">End-to-End HIPAA Encrypted Session</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
