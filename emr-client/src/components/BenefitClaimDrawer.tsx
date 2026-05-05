"use client";

import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { X, Search, FileText, CheckCircle2, AlertCircle, DollarSign, CreditCard } from "lucide-react";

const GET_PATIENTS = gql`
  query GetPatients {
    patients {
      patientId
      firstName
      lastName
      mrn
    }
  }
`;

const SUBMIT_CLAIM = gql`
  mutation SubmitClaim($input: SubmitZBenefitClaimCommandInput!) {
    submitZBenefitClaim(input: $input)
  }
`;

const UPDATE_CLAIM_STATUS = gql`
  mutation UpdateClaimStatus($input: UpdateClaimStatusCommandInput!) {
    updateClaimStatus(input: $input)
  }
`;

const PACKAGES = [
  { code: "Z001", label: "Early Stage Breast Cancer", amount: 100000 },
  { code: "Z002", label: "Prostate Cancer (Low to Intermediate Risk)", amount: 100000 },
  { code: "Z003", label: "Acute Lymphocytic Leukemia", amount: 210000 },
  { code: "Z004", label: "End Stage Renal Disease", amount: 270000 },
  { code: "Z005", label: "Peritoneal Dialysis", amount: 270000 },
  { code: "Z006", label: "Colon Cancer", amount: 150000 },
  { code: "Z007", label: "Rectal Cancer", amount: 150000 },
  { code: "Z008", label: "Coronary Artery Bypass Graft", amount: 550000 },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    claimId: string;
    patientId: string;
    philhealthNumber: string;
    packageCode: string;
    totalAmount: number;
    status: string;
  };
}

export default function BenefitClaimDrawer({ open, onClose, onSuccess, initialData }: Props) {
  const [selectedPatientId, setSelectedPatientId] = useState(initialData?.patientId || "");
  const [philhealthNumber, setPhilhealthNumber] = useState(initialData?.philhealthNumber || "");
  const [selectedPackage, setSelectedPackage] = useState(
    PACKAGES.find(p => p.code === initialData?.packageCode) || PACKAGES[0]
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [newStatus, setNewStatus] = useState(initialData?.status || "Submitted");

  const { data: patientData } = useQuery(GET_PATIENTS);
  const [submitClaim, { loading: submitting }] = useMutation(SUBMIT_CLAIM);
  const [updateStatus, { loading: updating }] = useMutation(UPDATE_CLAIM_STATUS);

  const isLoading = submitting || updating;

  const isEdit = !!initialData;

  const patients = patientData?.patients || [];
  const filteredPatients = patients.filter((p: any) => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !philhealthNumber) return;

    try {
      if (isEdit && initialData) {
        await updateStatus({
          variables: {
            input: {
              claimId: initialData.claimId,
              newStatus: newStatus,
              remarks: "Manual status update via dashboard"
            }
          }
        });
      } else {
        await submitClaim({
          variables: {
            input: {
              patientId: selectedPatientId,
              philhealthNumber,
              packageCode: selectedPackage.code,
              totalAmount: selectedPackage.amount
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[var(--card-bg)] h-full shadow-2xl border-l border-[var(--card-border)] flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--input-bg)]/50">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {isEdit ? "Manage Claim Status" : "Submit Z-Benefit Claim"}
            </h2>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-black mt-1">PhilHealth Integration</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--card-border)] rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {isEdit ? (
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Update Claim Status</label>
              <div className="grid grid-cols-2 gap-2">
                {["Submitted", "Approved", "Rejected", "Paid"].map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setNewStatus(status)}
                    className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      newStatus === status ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--primary)]/30'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Patient Selection */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Select Patient</label>
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
                
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
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

              {/* PhilHealth Number */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">PhilHealth Identification Number (PIN)</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input 
                    required
                    placeholder="00-000000000-0"
                    value={philhealthNumber}
                    onChange={(e) => setPhilhealthNumber(e.target.value)}
                    className="w-full premium-input rounded-2xl py-3 pl-12 pr-4 text-sm font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {/* Package Selection - Shared but disabled in edit if desired */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Z-Benefit Package</label>
            <div className={`grid grid-cols-1 gap-3 ${isEdit ? 'opacity-50 pointer-events-none' : ''}`}>
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.code}
                  type="button"
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                    selectedPackage.code === pkg.code ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--card-border)] hover:border-[var(--primary)]/30'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[10px] font-black bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded uppercase tracking-widest">{pkg.code}</span>
                       <h4 className="text-xs font-bold">{pkg.label}</h4>
                    </div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> {pkg.amount.toLocaleString()} Coverage
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedPackage.code === pkg.code ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-[var(--card-border)]'
                  }`}>
                    {selectedPackage.code === pkg.code && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-[var(--card-border)] bg-[var(--input-bg)]/50">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedPatientId || !philhealthNumber}
            className="w-full h-12 bg-[var(--primary)] text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-[var(--primary-glow)] hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? "Processing Submission..." : isEdit ? "Update Claim Status" : "Submit Claim to PhilHealth"}
          </button>
          <div className="mt-4 flex items-center gap-2 justify-center text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
            <AlertCircle className="w-3 h-3" />
            E-Claims submission is subject to validation
          </div>
        </div>
      </div>
    </div>
  );
}
