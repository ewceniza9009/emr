import { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  FileBox,
  ShieldCheck,
  Activity
} from "lucide-react";
import HalcyonPortal from "./Portal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  onSuccess: () => void;
}

export default function UploadDocumentDrawer({ isOpen, onClose, patientId, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("CLINICAL_RECORD");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file || !title) return;
    
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("documentType", type);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/general/${patientId}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Upload failed");
      }

      onSuccess();
      onClose();
      // Reset form
      setFile(null);
      setTitle("");
      setType("CLINICAL_RECORD");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
        
        <div className={`relative h-full w-full max-w-[500px] bg-[var(--sidebar-bg)] shadow-[-50px_0_150px_rgba(0,0,0,0.1)] 
          flex flex-col transition-transform duration-300 ease-out border-l border-[var(--card-border)]
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}>

          {/* Industrial Header */}
          <div className="h-20 w-full flex items-center justify-between px-8 bg-[var(--sidebar-bg)] border-b border-[var(--card-border)] shrink-0 backdrop-blur-md">
            <div className="flex items-center gap-6">
              <div className="w-1.5 h-10 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
              <div className="flex flex-col">
                <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none">Ingest Document</h2>
                <span className="text-[10px] font-black text-blue-500 tracking-[0.2em] mt-1 uppercase">Clinical Data Vault // Patient Record</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-[var(--text-primary)]">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-blue-500 bg-blue-500/10 w-8 h-8 rounded-lg flex items-center justify-center">01</span>
                <h3 className="text-xs font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">Document Identity</h3>
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Document Title</label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    required
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 pl-12 pr-4 text-xs font-black text-[var(--text-primary)] placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 transition-all uppercase"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Discharge Summary - May 2026"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Record Classification</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                  <select 
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 pl-12 pr-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 transition-all uppercase appearance-none"
                    value={type}
                    onChange={e => setType(e.target.value)}
                  >
                    <option value="CLINICAL_RECORD">Clinical Record</option>
                    <option value="ADVANCE_DIRECTIVE">Advance Directive (DNR/POLST)</option>
                    <option value="ID_VERIFICATION">ID Verification</option>
                    <option value="CONSENT_FORM">Consent Form</option>
                    <option value="INSURANCE">Insurance Card</option>
                    <option value="OTHER">Other Document</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-blue-500 bg-blue-500/10 w-8 h-8 rounded-lg flex items-center justify-center">02</span>
                <h3 className="text-xs font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">Digital Ingestion</h3>
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className={`relative h-48 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 cursor-pointer
                            ${file ? 'border-blue-500/50 bg-blue-500/5' : 'border-[var(--card-border)] hover:border-blue-500/30 bg-[var(--input-bg)]'}`}>
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file ? (
                    <>
                      <CheckCircle2 className="w-10 h-10 text-blue-500" />
                      <p className="text-xs font-black text-[var(--text-primary)] uppercase">{file.name}</p>
                      <button onClick={() => setFile(null)} className="text-[9px] text-rose-500 font-black uppercase hover:underline relative z-20">Remove File</button>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                         <FileBox className="w-7 h-7" />
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Drop file here or click to browse</p>
                      <p className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter">PDF, PNG, JPG (MAX 10MB)</p>
                    </>
                  )}
              </div>
            </section>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in shake duration-500">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-8 bg-[var(--sidebar-bg)] border-t border-[var(--card-border)] mt-auto flex flex-col gap-4">
            <button 
              onClick={handleUpload}
              disabled={!file || !title || isUploading}
              className="group w-full py-5 rounded-2xl bg-blue-500 text-white font-black text-xs uppercase tracking-[0.4em] transition-all shadow-[0_10px_30px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {isUploading ? (
                <Activity className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Commit To Vault</span>
                </>
              )}
            </button>
            <p className="text-[9px] font-black text-slate-700 text-center uppercase tracking-widest opacity-40">
              HIPAA Compliant Encrypted Ingestion
            </p>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
