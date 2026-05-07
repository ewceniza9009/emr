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
import PatientLookup from "@/components/PatientLookup";

const GET_PATIENT_CLAIMS = gql`
  query GetPatientClaims($patientId: Guid!) {
    zBenefitClaims(where: { patientId: { eq: $patientId } }, order: [{ createdAt: DESC }]) {
      claimId
      philhealthNumber
      packageCode
      status
      totalAmount
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
   const [isPatientLookupOpen, setIsPatientLookupOpen] = useState(false);
   const [selectedPatient, setSelectedPatient] = useState<any>(null);
   const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

   const [lineItems, setLineItems] = useState<LineItem[]>([
      { id: Math.random().toString(), description: "", quantity: 1, unitPrice: 0 }
   ]);

   const [dueInDays, setDueInDays] = useState(30);
   const [taxRate, setTaxRate] = useState(12); // Standard VAT
   const [discount, setDiscount] = useState(0);

   const [createInvoice, { loading: submitting }] = useMutation(CREATE_INVOICE);
   const { data: claimsData, refetch: refetchClaims } = useQuery(GET_PATIENT_CLAIMS, {
      variables: { patientId: selectedPatient?.patientId },
      skip: !selectedPatient?.patientId
   });

   const claims = claimsData?.zBenefitClaims || [];

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
      <div className="w-full min-h-screen bg-[var(--background)] text-[var(--text-secondary)] selection:bg-[var(--primary)] selection:text-white pb-16">
         <div className="w-full space-y-6 animate-fade-in max-w-[1600px] mx-auto pt-6 px-8">
            <PatientLookup
               open={isPatientLookupOpen}
               onClose={() => setIsPatientLookupOpen(false)}
               onSelect={(p) => {
                  setSelectedPatient(p);
                  setIsPatientLookupOpen(false);
               }}
            />

            {/* Global Financial Control Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b border-[var(--card-border)] relative">
               <div className="absolute -bottom-px left-0 w-32 h-px bg-[var(--primary)] shadow-[0_0_15px_var(--primary)]" />

               <div className="flex items-start gap-8">
                  <button
                     onClick={() => router.back()}
                     className="w-14 h-14 rounded-2xl bg-[var(--input-bg)] flex items-center justify-center border border-[var(--card-border)] hover:border-[var(--primary)]/50 hover:bg-[var(--card-border)] transition-all group"
                  >
                     <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <div className="space-y-1">
                     <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-black tracking-tighter uppercase leading-none text-[var(--text-primary)]">Billing Station</h1>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)]">
                           <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]" />
                           <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Auth Code: RCM-99</span>
                        </div>
                     </div>
                     <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.5em] flex items-center gap-2">
                        Halcyon Clinical Revenue Cycle <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" /> Sector 7-G
                     </p>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <div className="h-14 px-8 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col justify-center">
                     <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Status</span>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">Protocol Active</span>
                     </div>
                  </div>
                  <button className="px-8 h-14 rounded-2xl bg-[var(--input-bg)] text-[10px] font-black uppercase tracking-widest border border-[var(--card-border)] hover:bg-[var(--card-border)] transition-all flex items-center gap-3">
                     <Printer className="w-4 h-4 opacity-40" /> Print System
                  </button>
                  <button
                     onClick={handleSubmit}
                     disabled={submitting}
                     className="px-12 h-14 rounded-2xl bg-[var(--primary)] text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-[var(--primary-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-4 disabled:opacity-50"
                  >
                     {submitting ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                     {submitting ? 'EXECUTING...' : 'RELEASE INVOICE'}
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-12 gap-12">
               {/* Main Ledger Area */}
               <div className="col-span-12 xl:col-span-8 space-y-6">
                  <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)] shadow-3xl relative overflow-hidden backdrop-blur-xl">
                     <div className="absolute inset-0 bg-gradient-to-br from-[var(--input-bg)] to-transparent pointer-events-none" />

                     {/* Premium Header */}
                     <div className="p-8 pb-4 flex items-center justify-between relative">
                        <div className="flex items-center gap-4">
                           <div className="w-11 h-11 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 text-[var(--primary)]">
                              <FileText className="w-6 h-6" />
                           </div>
                           <div>
                              <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-primary)]">Billing Ledger</h2>
                              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5 opacity-50">Transaction distribution & itemization</p>
                           </div>
                        </div>
                        <button
                           onClick={addLineItem}
                           className="h-12 px-8 rounded-2xl bg-[var(--input-bg)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--primary)] hover:text-white transition-all border border-[var(--card-border)] flex items-center gap-3 group"
                        >
                           <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> New Entry
                        </button>
                     </div>

                     {/* Ledger Station */}
                     <div className="px-8 pb-8 space-y-1 relative">
                        {/* Header Row */}
                        <div className="grid grid-cols-12 gap-6 py-4 px-6 opacity-30">
                           <div className="col-span-6 text-[9px] font-black uppercase tracking-[0.3em]">Nomenclature / Service</div>
                           <div className="col-span-1 text-[9px] font-black uppercase tracking-[0.3em] text-center">Unit</div>
                           <div className="col-span-2 text-[9px] font-black uppercase tracking-[0.3em] text-right">Rate</div>
                           <div className="col-span-2 text-[9px] font-black uppercase tracking-[0.3em] text-right">Valuation</div>
                           <div className="col-span-1"></div>
                        </div>

                        <div className="space-y-3">
                           {lineItems.map((item) => (
                              <div key={item.id} className="grid grid-cols-12 gap-6 items-center p-3 bg-[var(--input-bg)]/30 hover:bg-[var(--input-bg)]/50 border border-[var(--card-border)] rounded-2xl transition-all group">
                                 <div className="col-span-6">
                                    <input
                                       placeholder="DEFINE SERVICE COMPONENT..."
                                       value={item.description}
                                       onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                                       className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold uppercase placeholder:opacity-10 text-[var(--text-primary)]"
                                    />
                                 </div>
                                 <div className="col-span-1">
                                    <input
                                       type="number"
                                       value={item.quantity}
                                       onChange={(e) => updateLineItem(item.id, "quantity", Number(e.target.value))}
                                       className="w-full bg-[var(--input-bg)] border-none rounded-xl py-2.5 text-center text-xs font-black focus:bg-[var(--input-bg)]/80 transition-all text-[var(--primary)]"
                                    />
                                 </div>
                                 <div className="col-span-2">
                                    <div className="relative group/input">
                                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black opacity-30">$</span>
                                       <input
                                          type="number"
                                          step="0.01"
                                          value={item.unitPrice}
                                          onChange={(e) => updateLineItem(item.id, "unitPrice", Number(e.target.value))}
                                          className="w-full bg-[var(--input-bg)] border-none rounded-xl py-2.5 pl-7 text-right text-xs font-black focus:bg-[var(--input-bg)]/80 transition-all text-[var(--text-primary)]"
                                       />
                                    </div>
                                 </div>
                                 <div className="col-span-2 text-right px-4">
                                    <span className="text-sm font-black text-[var(--text-primary)] tracking-tighter">
                                       ${(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                 </div>
                                 <div className="col-span-1 flex justify-center">
                                    <button
                                       onClick={() => removeLineItem(item.id)}
                                       className="p-2.5 rounded-xl text-rose-500/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Billing Reconciliaton Zone */}
                     <div className="p-8 bg-[var(--input-bg)]/10 border-t border-[var(--card-border)] grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7 space-y-6">
                           <div className="flex items-center gap-3">
                              <HistoryIcon className="w-4 h-4 text-[var(--primary)]" />
                              <label className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">Documentation / Terms</label>
                           </div>
                           <textarea
                              placeholder="RECORD ADMINISTRATIVE DIRECTIVES, BANKING CHANNELS, OR COMPLIANCE NOTES..."
                              className="w-full h-44 bg-[var(--input-bg)]/50 border border-[var(--card-border)] rounded-[2rem] p-8 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:border-[var(--primary)]/30 transition-all resize-none shadow-inner leading-relaxed text-[var(--text-secondary)]"
                           />
                        </div>

                        <div className="lg:col-span-5 flex flex-col justify-between py-2">
                           <div className="space-y-4">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] opacity-40 px-4">
                                 <span>Operational Subtotal</span>
                                 <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between items-center px-6 py-4 bg-[var(--input-bg)]/50 rounded-2xl border border-[var(--card-border)]">
                                 <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Adjustments</span>
                                 <div className="relative w-32">
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[9px] font-black opacity-20">$</span>
                                    <input
                                       type="number"
                                       value={discount}
                                       onChange={(e) => setDiscount(Number(e.target.value))}
                                       className="w-full bg-transparent border-none text-right text-sm font-black focus:ring-0 text-[var(--primary)]"
                                    />
                                 </div>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] opacity-40 px-4">
                                 <span>Tax Liability ({taxRate}%)</span>
                                 <span>${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                           </div>

                           <div className="bg-[var(--primary)] text-white rounded-3xl p-6 shadow-2xl flex items-center justify-between relative overflow-hidden mt-4">
                              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
                              <div className="relative">
                                 <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Total Billing Liability</p>
                                 <h3 className="text-5xl font-black tracking-tighter">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                              </div>
                              <Calculator className="w-20 h-20 opacity-20 relative rotate-12" />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Framework & Entities */}
               <div className="col-span-12 xl:col-span-4 space-y-6">
                  {/* Recipient Module */}
                  <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)] p-8 shadow-3xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--primary)]/5 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-[var(--primary)]/10 transition-all duration-700" />

                     <div className="flex items-center justify-between relative mb-10">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Recipient Protocol</h3>
                        {selectedPatient && (
                           <button
                              onClick={() => setIsPatientLookupOpen(true)}
                              className="text-[10px] font-black uppercase text-[var(--primary)] hover:underline underline-offset-4 transition-all"
                           >
                              Override
                           </button>
                        )}
                     </div>

                     {selectedPatient ? (
                        <div className="space-y-8 relative">
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-2xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--primary)] border border-[var(--card-border)] text-2xl font-black shadow-inner">
                                 {selectedPatient.firstName?.[0]}{selectedPatient.lastName?.[0]}
                              </div>
                              <div className="space-y-1">
                                 <h4 className="text-2xl font-black uppercase tracking-tighter leading-none text-[var(--text-primary)]">{selectedPatient.firstName} {selectedPatient.lastName}</h4>
                                 <div className="flex items-center gap-2">
                                    <Hash className="w-3.5 h-3.5 text-[var(--primary)]" />
                                    <span className="text-xs font-black text-[var(--primary)] uppercase tracking-widest">{selectedPatient.mrn}</span>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-3 pt-8 border-t border-[var(--card-border)]">
                              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest p-5 bg-[var(--input-bg)]/30 rounded-2xl border border-[var(--card-border)]">
                                 <MapPin className="w-5 h-5 text-[var(--primary)] opacity-40" />
                                 <span className="text-[var(--text-secondary)]">{selectedPatient.addresses?.find((a: any) => a.isPrimary)?.address?.city || 'METROPOLIS CLUSTER'}</span>
                              </div>
                              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest p-5 bg-[var(--input-bg)]/30 rounded-2xl border border-[var(--card-border)]">
                                 <User className="w-5 h-5 text-[var(--primary)] opacity-40" />
                                 <span className="text-[var(--text-secondary)]">Verified Patient Profile</span>
                              </div>
                           </div>
                        </div>
                     ) : (
                        <button
                           onClick={() => setIsPatientLookupOpen(true)}
                           className="w-full aspect-square rounded-[3rem] border-2 border-dashed border-[var(--card-border)] flex flex-col items-center justify-center gap-8 hover:border-[var(--primary)]/50 hover:bg-[var(--input-bg)]/50 transition-all group relative overflow-hidden"
                        >
                           <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           <div className="w-28 h-28 rounded-[2rem] bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:scale-105 transition-all border border-[var(--card-border)] shadow-2xl relative">
                              <User className="w-12 h-12" />
                           </div>
                           <div className="text-center space-y-2 relative">
                              <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--text-primary)]/60">Initialize Entity</p>
                              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] px-12 leading-relaxed">Registry Linkage Required</p>
                           </div>
                           <Plus className="absolute bottom-12 right-12 w-8 h-8 text-[var(--primary)] opacity-10 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                     )}
                  </div>

                  {/* Z-Benefit Integration */}
                  <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)] p-8 shadow-3xl space-y-6 relative overflow-hidden group">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <CheckCircle2 className="w-6 h-6 text-[var(--primary)]" />
                           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Z-Benefit Integration</h3>
                        </div>
                        {selectedPatient && claims.length > 0 && (
                           <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest">Active Claims</span>
                        )}
                     </div>

                     {selectedPatient ? (
                        <div className="space-y-4">
                           {claims.length > 0 ? (
                              claims.map((claim: any) => (
                                 <button
                                    key={claim.claimId}
                                    onClick={() => setSelectedClaimId(selectedClaimId === claim.claimId ? null : claim.claimId)}
                                    className={`w-full p-6 rounded-3xl border transition-all text-left group/claim ${selectedClaimId === claim.claimId
                                          ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-2xl shadow-[var(--primary-glow)] scale-[1.02]'
                                          : 'bg-[var(--input-bg)] border-[var(--card-border)] hover:border-[var(--primary)]/30'
                                       }`}
                                 >
                                    <div className="flex justify-between items-start mb-4">
                                       <div className="space-y-1">
                                          <p className={`text-[9px] font-black uppercase tracking-widest ${selectedClaimId === claim.claimId ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>PhilHealth PIN</p>
                                          <p className="text-sm font-black tracking-tighter">{claim.philhealthNumber}</p>
                                       </div>
                                       <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${selectedClaimId === claim.claimId ? 'bg-white/20 text-white' : 'bg-[var(--primary)]/10 text-[var(--primary)]'
                                          }`}>
                                          {claim.packageCode}
                                       </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                       <div className="space-y-1">
                                          <p className={`text-[9px] font-black uppercase tracking-widest ${selectedClaimId === claim.claimId ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>Status</p>
                                          <p className="text-[10px] font-black uppercase">{claim.status}</p>
                                       </div>
                                       <div className="text-right">
                                          <p className={`text-[9px] font-black uppercase tracking-widest ${selectedClaimId === claim.claimId ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>Coverage</p>
                                          <p className="text-sm font-black tracking-tighter">${claim.totalAmount.toLocaleString()}</p>
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
                        <div className="py-12 opacity-20 flex flex-col items-center justify-center text-center">
                           <Clock className="w-10 h-10 mb-4" />
                           <p className="text-[10px] font-black uppercase tracking-widest">Select Patient to Query Registry</p>
                        </div>
                     )}
                  </div>

                  {/* Scheduling Configuration */}
                  <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)] p-8 shadow-3xl space-y-8 relative overflow-hidden">
                     <div className="space-y-8">
                        <div className="flex items-center gap-4">
                           <Calendar className="w-6 h-6 text-[var(--primary)]" />
                           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Temporal Vector</h3>
                        </div>

                        <div className="space-y-5">
                           <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] ml-1">Settlement Framework</label>
                           <div className="grid grid-cols-2 gap-4">
                              {[15, 30, 45, 60].map(days => (
                                 <button
                                    key={days}
                                    onClick={() => setDueInDays(days)}
                                    className={`py-5 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${dueInDays === days
                                          ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-2xl shadow-[var(--primary-glow)] scale-105'
                                          : 'bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--primary)]/30'
                                       }`}
                                 >
                                    {days} Days
                                 </button>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="space-y-8 pt-10 border-t border-[var(--card-border)]">
                        <div className="flex flex-col gap-4">
                           <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] ml-1">Effective Date</label>
                           <div className="flex items-center justify-between p-6 bg-[var(--input-bg)]/50 rounded-2xl border border-[var(--card-border)] shadow-inner">
                              <span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                              <Calendar className="w-5 h-5 opacity-20" />
                           </div>
                        </div>

                        <div className="flex flex-col gap-4 pt-2">
                           <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] ml-1">Projected Maturity</label>
                           <div className="flex items-center justify-between p-6 bg-[var(--primary)]/10 rounded-2xl border border-[var(--primary)]/20 text-[var(--primary)]">
                              <span className="text-xs font-black uppercase tracking-[0.2em]">
                                 {new Date(Date.now() + dueInDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              </span>
                              <CheckCircle2 className="w-5 h-5 animate-pulse" />
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


