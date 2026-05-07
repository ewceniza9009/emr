"use client";

import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { X, Search, FileText, CheckCircle2, AlertCircle, DollarSign, Calculator, Calendar } from "lucide-react";
import { useCommandModal } from "./CommandModalProvider";

const GET_PATIENTS = gql`
  query GetPatients {
    patients {
      items {
        patientId
        firstName
        lastName
        mrn
      }
    }
  }
`;

const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: CreateInvoiceCommandInput!) {
    createInvoice(input: $input) {
      invoiceId
      invoiceNumber
    }
  }
`;

const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($input: UpdateInvoiceCommandInput!) {
    updateInvoice(input: $input) {
      invoiceId
    }
  }
`;

const VOID_INVOICE = gql`
  mutation VoidInvoice($input: VoidInvoiceCommandInput!) {
    voidInvoice(input: $input)
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    invoiceId: string;
    patientId: string;
    subtotalAmount: number;
    coveredAmount: number;
    dueInDays: number;
    status: string;
  };
}

export default function InvoiceDrawer({ open, onClose, onSuccess, initialData }: Props) {
  const { confirm, alert } = useCommandModal();
  const [selectedPatientId, setSelectedPatientId] = useState(initialData?.patientId || "");
  const [subtotal, setSubtotal] = useState<number>(initialData?.subtotalAmount || 0);
  const [covered, setCovered] = useState<number>(initialData?.coveredAmount || 0);
  const [dueInDays, setDueInDays] = useState(initialData?.dueInDays || 30);
  const [searchTerm, setSearchTerm] = useState("");
  const [downloading, setDownloading] = useState(false);

  const { data: patientData } = useQuery(GET_PATIENTS);
  const [createInvoice, { loading: creating }] = useMutation(CREATE_INVOICE);
  const [updateInvoice, { loading: updating }] = useMutation(UPDATE_INVOICE);
  const [voidInvoice, { loading: voiding }] = useMutation(VOID_INVOICE);

  const isEdit = !!initialData;
  const submitting = creating || updating || voiding;

  const patients = patientData?.patients?.items || [];
  const filteredPatients = patients.filter((p: any) => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const patientResponsibility = Math.max(0, subtotal - covered);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || subtotal <= 0) return;

    try {
      if (isEdit && initialData) {
        await updateInvoice({
          variables: {
            input: {
              invoiceId: initialData.invoiceId,
              subtotalAmount: subtotal,
              coveredAmount: covered,
              dueInDays: dueInDays
            }
          }
        });
      } else {
        await createInvoice({
          variables: {
            input: {
              patientId: selectedPatientId,
              subtotalAmount: subtotal,
              coveredAmount: covered,
              dueInDays: dueInDays
            }
          }
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVoid = async () => {
    if (!initialData) return;
    const ok = await confirm({
      title: "Void Invoice",
      message: "Are you sure you want to void this invoice? This action cannot be undone and will remove it from active billing.",
      type: "danger",
      confirmText: "Void Invoice"
    });
    if (!ok) return;
    
    try {
      await voidInvoice({
        variables: {
          input: {
            invoiceId: initialData.invoiceId
          }
        }
      });
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPdf = async () => {
    if (!initialData?.invoiceId) return;
    setDownloading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clinical/export/invoice/${initialData.invoiceId}`);
      if (!response.ok) throw new Error("Failed to export PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${initialData.invoiceId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      await alert({
        title: "Export Failed",
        message: "An error occurred while generating the invoice PDF. Please verify connection and try again.",
        type: "danger"
      });
    } finally {
      setDownloading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[var(--card-bg)] h-full shadow-2xl border-l border-[var(--card-border)] flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]/50">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">
              {isEdit ? "Edit Patient Invoice" : "Generate New Invoice"}
            </h2>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-black mt-1">Patient Billing Unit</p>
          </div>
          <div className="flex items-center gap-3">
            {isEdit && (
              <button 
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
              >
                {downloading ? <span className="animate-spin">⏳</span> : <FileText className="w-4 h-4" />}
                Export PDF
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-[var(--card-border)] rounded-xl transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Patient Selection */}
          <div className={`space-y-4 ${isEdit ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Select Recipient</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input 
                type="text"
                placeholder="Search patient name or MRN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full premium-input rounded-2xl py-3 pl-12 pr-4 text-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {filteredPatients.map((p: any) => (
                <button
                  key={p.patientId}
                  type="button"
                  onClick={() => setSelectedPatientId(p.patientId)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                    selectedPatientId === p.patientId ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--card-border)] hover:border-[var(--primary)]/30'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{p.firstName} {p.lastName}</p>
                    <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">{p.mrn}</p>
                  </div>
                  {selectedPatientId === p.patientId && <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Subtotal Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  type="number"
                  required
                  value={subtotal}
                  onChange={(e) => setSubtotal(Number(e.target.value))}
                  className="w-full premium-input rounded-2xl py-3 pl-12 pr-4 text-sm"
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Insurance Covered</label>
              <div className="relative">
                <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
                <input 
                  type="number"
                  value={covered}
                  onChange={(e) => setCovered(Number(e.target.value))}
                  className="w-full premium-input rounded-2xl py-3 pl-12 pr-4 text-sm text-emerald-500 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Payment Terms (Due Days)</label>
            <div className="flex gap-2">
              {[15, 30, 45, 60].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDueInDays(days)}
                  className={`flex-1 py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${
                    dueInDays === days ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--primary)]/30'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-[var(--input-bg)] rounded-[2rem] p-6 border border-[var(--card-border)] space-y-3">
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                <span>Gross Billing</span>
                <span>${subtotal.toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-500">
                <span>Coverage Deductions</span>
                <span>-${covered.toLocaleString()}</span>
             </div>
             <div className="h-px bg-[var(--card-border)] my-2" />
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Patient Responsibility</p>
                   <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">${patientResponsibility.toLocaleString()}</h3>
                </div>
                <Calculator className="w-8 h-8 text-[var(--primary)] opacity-20" />
             </div>
          </div>
        </form>

        <div className="p-6 border-t border-[var(--card-border)] bg-[var(--input-bg)]/50 space-y-3">
          {isEdit && (
            <button
              type="button"
              onClick={handleVoid}
              disabled={submitting}
              className="w-full h-11 border border-rose-500/30 text-rose-500 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-rose-500/5 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              Void Invoice
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedPatientId || subtotal <= 0}
            className="w-full h-12 bg-white text-black rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl hover:bg-slate-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? "Processing..." : isEdit ? "Save Changes" : "Create & Issue Invoice"}
          </button>
          <div className="mt-4 flex items-center gap-2 justify-center text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
            <Calendar className="w-3 h-3" />
            Due Date: {new Date(Date.now() + dueInDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
