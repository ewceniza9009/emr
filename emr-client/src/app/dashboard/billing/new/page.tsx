"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import {
   FileText,
   User,
   Calendar,
   DollarSign,
   Plus,
   Trash2,
   CheckCircle2,
   ArrowLeft,
   Search,
   ChevronDown,
   Printer,
   Save,
   Send,
   Calculator,
   MapPin,
   Hash,
   Clock,
   History as HistoryIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { useSettings } from "@/lib/SettingsContext";
import PatientLookup from "@/components/PatientLookup";

const GET_PATIENT_CLAIMS = gql`
  query GetPatientClaims($patientId: UUID!) {
    zBenefitClaims(where: { patientId: { eq: $patientId } }, order: [{ createdAt: DESC }]) {
      items {
        claimId
        philhealthNumber
        packageCode
        status
        totalAmount
      }
    }
  }
`;

const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: CreateInvoiceCommandInput!) {
    createBillingInvoice(input: $input) {
      invoiceId
      invoiceNumber
    }
  }
`;

interface LineItem {
   id: string;
   description: string;
   quantity: number;
   unitPrice: number;
}

export default function NewInvoicePage() {
   const router = useRouter();
   const { showToast } = useToast();
   const { formatCurrency, tenantConfig, currencySymbol } = useSettings();
   const [isPatientLookupOpen, setIsPatientLookupOpen] = useState(false);
   const [selectedPatient, setSelectedPatient] = useState<any>(null);
   const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

   const [lineItems, setLineItems] = useState<LineItem[]>([
      { id: Math.random().toString(), description: "", quantity: 1, unitPrice: 0 }
   ]);

   const [dueInDays, setDueInDays] = useState(30);
   const [taxRate, setTaxRate] = useState(12); // Standard VAT
   const [discount, setDiscount] = useState(0);
   const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

   const [createInvoice, { loading: submitting }] = useMutation(CREATE_INVOICE);
   const { data: claimsData, refetch: refetchClaims } = useQuery(GET_PATIENT_CLAIMS, {
      variables: { patientId: selectedPatient?.patientId },
      skip: !selectedPatient?.patientId
   });

   const claims = claimsData?.zBenefitClaims?.items || [];

   useEffect(() => {
      if (selectedPatient?.patientId) {
         refetchClaims();
         setSelectedClaimId(null);
      }
   }, [selectedPatient, refetchClaims]);

   const subtotal = lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
   const taxAmount = (subtotal - discount) * (taxRate / 100);
   const totalAmount = subtotal - discount + taxAmount;

   const addLineItem = () => {
      setLineItems([...lineItems, { id: Math.random().toString(), description: "", quantity: 1, unitPrice: 0 }]);
   };

   const removeLineItem = (id: string) => {
      if (lineItems.length === 1) return;
      setLineItems(lineItems.filter(item => item.id !== id));
   };

   const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
      setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
   };

   const handleSubmit = async () => {
      if (!selectedPatient) {
         showToast("Please select a patient entity", "error");
         return;
      }

      if (lineItems.some(item => !item.description || item.unitPrice <= 0)) {
         showToast("Please complete all line items", "error");
         return;
      }

      try {
         await createInvoice({
            variables: {
               input: {
                  patientId: selectedPatient.patientId,
                  claimId: selectedClaimId,
                  subtotalAmount: totalAmount,
                  coveredAmount: 0,
                  dueInDays,
                  items: lineItems.map(i => ({
                     description: i.description,
                     quantity: i.quantity,
                     unitPrice: i.unitPrice
                  }))
               }
            }
         });
         showToast("Invoice Generated Successfully", "success");
         router.push("/dashboard/billing");
      } catch (err) {
         console.error(err);
         showToast("Failed to generate invoice", "error");
      }
   };

   return (
      <div className="w-full h-[calc(100vh-70px)] bg-[var(--background)] text-[var(--text-secondary)] selection:bg-[#cfe2ff] selection:text-[#000000] flex flex-col overflow-y-auto custom-scrollbar">
         <div className="flex-1 w-full space-y-4 animate-fade-in max-w-[1600px] mx-auto pt-4 pb-8 px-6 flex flex-col min-h-0">
            <PatientLookup
               open={isPatientLookupOpen}
               onClose={() => setIsPatientLookupOpen(false)}
               onSelect={(p) => {
                  setSelectedPatient(p);
                  setIsPatientLookupOpen(false);
               }}
            />

            {/* Global Financial Control Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)] relative">
               <div className="flex items-center gap-4">
                  <button
                     onClick={() => router.back()}
                     className="w-10 h-10 rounded-xl bg-[var(--input-bg)] flex items-center justify-center border border-[var(--card-border)] hover:border-[var(--primary)]/50 hover:bg-[var(--card-border)] transition-all group"
                  >
                     <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <div className="space-y-0.5">
                     <div className="flex items-center gap-2">
                        <h1 className="text-xl font-black tracking-tighter uppercase leading-none text-[var(--text-primary)]">Billing Station</h1>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)]">
                           <div className="w-1 h-1 rounded-full bg-[var(--primary)] shadow-[0_0_5px_var(--primary)]" />
                           <span className="text-[9px] font-black uppercase tracking-[0.1em] opacity-70">Auth: RCM-99</span>
                        </div>
                     </div>
                     <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-2">
                        Revenue Cycle <span className="w-0.5 h-0.5 rounded-full bg-[var(--card-border)] opacity-30" /> Sector 7-G
                     </p>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <button className="px-4 h-10 rounded-xl bg-[var(--input-bg)] text-[9px] font-black uppercase tracking-widest border border-[var(--card-border)] hover:bg-[var(--card-border)] transition-all flex items-center gap-2">
                     <Printer className="w-3.5 h-3.5 opacity-40" /> Print
                  </button>
                  <button
                     onClick={handleSubmit}
                     disabled={submitting}
                     className="px-6 h-10 rounded-xl bg-[var(--primary)] text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[var(--primary-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                     {submitting ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                     {submitting ? 'EXECUTING...' : 'RELEASE INVOICE'}
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 pb-6">
               {/* Main Ledger Area */}
               <div className="col-span-12 xl:col-span-8 flex flex-col min-h-0">
                  <div className="bg-[var(--card-bg)] rounded-[1.5rem] border border-[var(--card-border)] shadow-xl relative overflow-hidden backdrop-blur-xl flex flex-col h-full">
                     <div className="absolute inset-0 bg-gradient-to-br from-[var(--input-bg)] to-transparent pointer-events-none" />

                     {/* Premium Header */}
                     <div className="p-5 pb-2 flex items-center justify-between relative">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 text-[var(--primary)]">
                              <FileText className="w-5 h-5" />
                           </div>
                           <div>
                              <h2 className="text-lg font-black uppercase tracking-tight text-[var(--text-primary)]">Billing Ledger</h2>
                              <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5 opacity-50">Transaction distribution & itemization</p>
                           </div>
                        </div>
                        <button
                           onClick={addLineItem}
                           className="h-10 px-6 rounded-xl bg-[var(--input-bg)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--primary)] hover:text-white transition-all border border-[var(--card-border)] flex items-center gap-2 group"
                        >
                           <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> New Entry
                        </button>
                     </div>

                     {/* Ledger Station */}
                     <div className="flex-1 flex flex-col min-h-0 relative">
                        {/* Header Row (Static) */}
                        <div className="px-6 grid grid-cols-12 gap-4 py-3 px-4 opacity-50 sticky top-0 bg-[var(--card-bg)] z-10">
                           <div className="col-span-6 text-[9px] font-black uppercase tracking-[0.2em]">Nomenclature / Service</div>
                           <div className="col-span-1 text-[9px] font-black uppercase tracking-[0.2em] text-center">Unit</div>
                           <div className="col-span-2 text-[9px] font-black uppercase tracking-[0.2em] text-right">Rate</div>
                           <div className="col-span-2 text-[9px] font-black uppercase tracking-[0.2em] text-right">Valuation</div>
                           <div className="col-span-1"></div>
                        </div>

                        {/* Scrollable Entry Zone */}
                        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2 custom-scrollbar">
                           {lineItems.map((item) => (
                              <div key={item.id} className="grid grid-cols-12 gap-4 items-center p-2 bg-[var(--input-bg)]/30 hover:bg-[var(--input-bg)]/50 border border-[var(--card-border)] rounded-xl transition-all group">
                                 <div className="col-span-6">
                                    <input
                                       placeholder="DEFINE SERVICE COMPONENT..."
                                       value={item.description}
                                       onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                                       className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-xs font-bold uppercase placeholder:opacity-30 text-[var(--text-primary)] transition-all"
                                    />
                                 </div>
                                 <div className="col-span-1">
                                    <input
                                       type="number"
                                       value={item.quantity}
                                       onChange={(e) => updateLineItem(item.id, "quantity", Number(e.target.value))}
                                       className="w-full bg-[var(--input-bg)] border-none rounded-lg py-2 text-center text-xs font-black focus:bg-[var(--input-bg)]/80 transition-all text-[var(--primary)]"
                                    />
                                 </div>
                                 <div className="col-span-2">
                                    <div className="relative group/input">
                                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black opacity-30">{currencySymbol}</span>
                                       <input
                                          type="number"
                                          step="0.01"
                                          value={item.unitPrice}
                                          onChange={(e) => updateLineItem(item.id, "unitPrice", Number(e.target.value))}
                                          className="w-full bg-[var(--input-bg)] border-none rounded-lg py-2 pl-7 text-right text-xs font-black focus:bg-[var(--input-bg)]/80 transition-all text-[var(--text-primary)]"
                                       />
                                    </div>
                                 </div>
                                 <div className="col-span-2 text-right px-2">
                                    <span className="text-xs font-black text-[var(--text-primary)] tracking-tighter">
                                       {formatCurrency(item.quantity * item.unitPrice)}
                                    </span>
                                 </div>
                                 <div className="col-span-1 flex justify-center">
                                    <button
                                       onClick={() => removeLineItem(item.id)}
                                       className="p-1.5 rounded-lg text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-90"
                                    >
                                       <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Billing Reconciliaton Zone (Anchored) */}
                     <div className="p-6 bg-[var(--input-bg)]/10 border-t border-[var(--card-border)] grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0">
                        <div className="lg:col-span-7 space-y-3">
                           <div className="flex items-center gap-2">
                              <HistoryIcon className="w-3.5 h-3.5 text-[var(--primary)]" />
                              <label className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Documentation / Terms</label>
                           </div>
                           <textarea
                              placeholder="RECORD ADMINISTRATIVE DIRECTIVES, BANKING CHANNELS, OR COMPLIANCE NOTES..."
                              className="w-full h-24 bg-[var(--input-bg)]/50 border border-[var(--card-border)] rounded-[1.5rem] p-5 text-[9px] font-bold uppercase tracking-widest focus:outline-none focus:border-[var(--primary)]/30 transition-all resize-none shadow-inner leading-relaxed text-[var(--text-secondary)]"
                           />
                        </div>

                        <div className="lg:col-span-5 flex flex-col justify-between">
                           <div className="space-y-2">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.1em] opacity-60 px-2">
                                 <span>Operational Subtotal</span>
                                 <span>{formatCurrency(subtotal)}</span>
                              </div>
                              <div className="flex justify-between items-center px-4 py-2.5 bg-[var(--input-bg)]/50 rounded-xl border border-[var(--card-border)] group/adj">
                                 <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Adjustments</span>
                                 <div className="relative w-28">
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-20">{currencySymbol}</span>
                                    <input
                                       type="number"
                                       value={discount}
                                       onChange={(e) => setDiscount(Number(e.target.value))}
                                       className="w-full bg-transparent border-none text-right text-xs font-black focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-[var(--primary)]"
                                    />
                                 </div>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.1em] opacity-60 px-2">
                                 <span>Tax Liability ({taxRate}%)</span>
                                 <span>{formatCurrency(taxAmount)}</span>
                              </div>
                           </div>

                           <div className="bg-[var(--primary)] text-white rounded-2xl p-4 shadow-xl flex items-center justify-between relative overflow-hidden mt-3">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                              <div className="relative">
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Total Liability</p>
                                 <h3 className="text-3xl font-black tracking-tighter text-white">{formatCurrency(totalAmount)}</h3>
                              </div>
                              <Calculator className="w-12 h-12 opacity-20 relative rotate-12" />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Framework & Entities */}
               <div className="col-span-12 xl:col-span-4 space-y-4 flex flex-col h-full overflow-y-auto custom-scrollbar">
                  {/* Recipient Module */}
                  <div className="bg-[var(--card-bg)] rounded-[1.5rem] border border-[var(--card-border)] p-6 shadow-xl relative overflow-hidden group flex flex-col min-h-[260px]">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-[var(--primary)]/10 transition-all duration-700" />

                     <div className="flex items-center justify-between relative mb-6">
                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Recipient Protocol</h3>
                        {selectedPatient && (
                           <button
                              onClick={() => setIsPatientLookupOpen(true)}
                              className="text-[8px] font-black uppercase text-[var(--primary)] hover:underline underline-offset-4 transition-all"
                           >
                              Override
                           </button>
                        )}
                     </div>
                     <div className="flex-1 flex flex-col justify-center">
                        {selectedPatient ? (
                           <div className="space-y-4 relative">
                              <div className="flex items-center gap-3">
                                 <div className="w-12 h-12 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--primary)] border border-[var(--card-border)] text-lg font-black shadow-inner">
                                    {selectedPatient.title?.split(' ').map((n: any) => n[0]).join('').slice(0, 2) || "P"}
                                 </div>
                                 <div className="space-y-0.5">
                                    <h4 className="text-lg font-black uppercase tracking-tighter leading-none text-[var(--text-primary)]">
                                       {selectedPatient.title || "UNKNOWN ENTITY"}
                                    </h4>
                                    <div className="flex items-center gap-1.5">
                                       <Hash className="w-3 h-3 text-[var(--primary)]" />
                                       <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest">
                                          {selectedPatient.subtitle || selectedPatient.id?.slice(0, 8) || "N/A"}
                                       </span>
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-2 pt-4 border-t border-[var(--card-border)]">
                                 <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest p-3 bg-[var(--input-bg)]/30 rounded-xl border border-[var(--card-border)]">
                                    <MapPin className="w-4 h-4 text-[var(--primary)] opacity-40" />
                                    <span className="text-[var(--text-secondary)]">{selectedPatient.metadata || 'METROPOLIS CLUSTER'}</span>
                                 </div>
                                 <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest p-3 bg-[var(--input-bg)]/30 rounded-xl border border-[var(--card-border)]">
                                    <User className="w-4 h-4 text-[var(--primary)] opacity-40" />
                                    <span className="text-[var(--text-secondary)]">Verified Patient Profile</span>
                                 </div>
                              </div>
                           </div>
                        ) : (
                           <button
                              onClick={() => setIsPatientLookupOpen(true)}
                              className="w-full py-8 rounded-[2rem] border-2 border-dashed border-[var(--card-border)] flex flex-col items-center justify-center gap-4 hover:border-[var(--primary)]/50 hover:bg-[var(--input-bg)]/50 transition-all group relative overflow-hidden"
                           >
                              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="w-16 h-16 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:scale-105 transition-all border border-[var(--card-border)] shadow-xl relative">
                                 <User className="w-8 h-8" />
                              </div>
                              <div className="text-center space-y-1 relative">
                                 <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)]/60">Initialize Entity</p>
                                 <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-[0.1em] px-8 leading-relaxed">Registry Linkage Required</p>
                              </div>
                           </button>
                        )}
                     </div>
                  </div>

                  {/* Z-Benefit Integration */}
                  <div className="bg-[var(--card-bg)] rounded-[1.5rem] border border-[var(--card-border)] p-6 shadow-xl flex flex-col relative overflow-hidden group min-h-[260px]">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                           <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" />
                           <h3 className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Benefit Integration</h3>
                        </div>
                        {selectedPatient && claims.length > 0 && (
                           <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[7px] font-black uppercase tracking-widest">Active Claims</span>
                        )}
                     </div>

                     {selectedPatient ? (
                        <div className="space-y-4">
                           {claims.length > 0 ? (
                              claims.map((claim: any) => (
                                 <button
                                    key={claim.claimId}
                                    onClick={() => setSelectedClaimId(selectedClaimId === claim.claimId ? null : claim.claimId)}
                                    className={`w-full p-4 rounded-2xl border transition-all text-left group/claim ${selectedClaimId === claim.claimId
                                       ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-xl shadow-[var(--primary-glow)] scale-[1.01]'
                                       : 'bg-[var(--input-bg)] border-[var(--card-border)] hover:border-[var(--primary)]/30'
                                       }`}
                                 >
                                    <div className="flex justify-between items-start mb-3">
                                       <div className="space-y-0.5">
                                          <p className={`text-[8px] font-black uppercase tracking-widest ${selectedClaimId === claim.claimId ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>PhilHealth PIN</p>
                                          <p className="text-xs font-black tracking-tighter">{claim.philhealthNumber}</p>
                                       </div>
                                       <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${selectedClaimId === claim.claimId ? 'bg-white/20 text-white' : 'bg-[var(--primary)]/10 text-[var(--primary)]'
                                          }`}>
                                          {claim.packageCode}
                                       </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                       <div className="space-y-0.5">
                                          <p className={`text-[8px] font-black uppercase tracking-widest ${selectedClaimId === claim.claimId ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>Status</p>
                                          <p className="text-[9px] font-black uppercase">{claim.status}</p>
                                       </div>
                                       <div className="text-right">
                                          <p className={`text-[8px] font-black uppercase tracking-widest ${selectedClaimId === claim.claimId ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>Coverage</p>
                                          <p className="text-xs font-black tracking-tighter">{formatCurrency(claim.totalAmount)}</p>
                                       </div>
                                    </div>
                                 </button>
                              ))
                           ) : (
                              <div className="py-12 border-2 border-dashed border-[var(--card-border)] rounded-[2.5rem] flex flex-col items-center justify-center text-center px-8">
                                 <FileText className="w-10 h-10 text-[var(--text-muted)] opacity-10 mb-4" />
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">No active benefit claims found for this entity</p>
                              </div>
                           )}
                        </div>
                     ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30 pb-4">
                           <div className="w-14 h-14 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center mb-4">
                              <Clock className="w-6 h-6 text-[var(--text-muted)]" />
                           </div>
                           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-center max-w-[140px] leading-relaxed">Select patient to query registry</p>
                        </div>
                     )}
                  </div>

                  {/* Scheduling Configuration */}
                  <div className="bg-[var(--card-bg)] rounded-[1.5rem] border border-[var(--card-border)] p-5 shadow-xl space-y-4 relative overflow-hidden flex flex-col">
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <Calendar className="w-5 h-5 text-[var(--primary)]" />
                           <h3 className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Payment Terms</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                           <div className="flex flex-col gap-2">
                              <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] ml-1">Invoice Date</label>
                              <div className="relative group/date">
                                 <input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    className="w-full bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-xl p-3.5 text-[10px] font-black uppercase tracking-[0.1em] text-[var(--primary)] outline-none focus:border-[var(--primary)]/50 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                 />
                                 <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--primary)] opacity-40 pointer-events-none group-focus-within/date:opacity-100 transition-all" />
                              </div>
                           </div>

                           <div className="flex flex-col gap-2">
                              <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] ml-1">Projected Maturity</label>
                              <div className="flex items-center justify-between p-3.5 bg-[var(--primary)]/10 rounded-xl border border-[var(--primary)]/20 text-[var(--primary)]">
                                 <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                                    {new Date(new Date(invoiceDate).getTime() + dueInDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                 </span>
                                 <CheckCircle2 className="w-4 h-4" />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-[var(--card-border)]">
                           <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] ml-1">Settlement Framework</label>
                           <div className="grid grid-cols-3 gap-3">
                              {[30, 60, 90].map(days => (
                                 <button
                                    key={days}
                                    onClick={() => setDueInDays(days)}
                                    className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${dueInDays === days
                                       ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary-glow)] scale-105'
                                       : 'bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--primary)]/30'
                                       }`}
                                 >
                                    {days} Days
                                 </button>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}


