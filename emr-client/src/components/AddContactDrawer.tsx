"use client";

import { useState, useEffect } from "react";
import { useMutation, gql } from "@apollo/client";
import {
  X, UserPlus, Save, Phone, Mail, User, ShieldCheck,
  CheckCircle, Activity, ChevronRight, Briefcase,
  Edit3, Plus, Upload, AlertCircle,
  Trash2
} from "lucide-react";
import HalcyonPortal from "./Portal";
import { useCommandModal } from "@/components/CommandModalProvider";

const ADD_CONTACT = gql`
  mutation AddContact($command: AddContactCommandInput!) {
    addContact(command: $command)
  }
`;

const UPDATE_CONTACT = gql`
  mutation UpdateContact($command: UpdateContactCommandInput!) {
    updateContact(command: $command)
  }
`;

const DELETE_CONTACT = gql`
  mutation DeleteContact($command: DeleteContactCommandInput!) {
    deleteContact(command: $command)
  }
`;

interface Props {
  isOpen: boolean;
  patientId: string;
  initialData?: any;
  onSuccess: () => void;
  onClose: () => void;
  existingPoaFile?: string;
}

export default function AddContactDrawer({ isOpen, patientId, initialData, onSuccess, onClose, existingPoaFile }: Props): JSX.Element | null {
  const { alert, confirm } = useCommandModal();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    relationship: "Spouse",
    phoneNumber: "",
    email: "",
    isPrimaryContact: false,
    hasPowerOfAttorney: false,
    isLegalGuardian: false,
    notes: ""
  });

  const [localError, setLocalError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setLocalError(null);
      setIsSuccess(false);
      setForm(initialData ? {
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        relationship: initialData.relationship,
        phoneNumber: initialData.phone,
        email: initialData.email,
        isPrimaryContact: initialData.isPrimaryContact,
        hasPowerOfAttorney: initialData.isPoa,
        isLegalGuardian: initialData.isLegalGuardian,
        notes: initialData.notes || ""
      } : {
        firstName: "",
        lastName: "",
        relationship: "Spouse",
        phoneNumber: "",
        email: "",
        isPrimaryContact: false,
        hasPowerOfAttorney: false,
        isLegalGuardian: false,
        notes: ""
      });
    }
  }, [isOpen, initialData]);

  const [addContact, { loading: adding, error: addError }] = useMutation(ADD_CONTACT, {
    refetchQueries: ["GetPatientDetails"]
  });

  const [updateContact, { loading: updating, error: updateError }] = useMutation(UPDATE_CONTACT, {
    refetchQueries: ["GetPatientDetails"]
  });

  const [deleteContact, { loading: deleting }] = useMutation(DELETE_CONTACT, {
    refetchQueries: ["GetPatientDetails"]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AddContactDrawer] handleSubmit initiated. Form state:", form);
    setLocalError(null);

    try {
      // Validation: If POA is checked, a file MUST be provided UNLESS they are already a POA
      if (form.hasPowerOfAttorney && !selectedFile && !existingPoaFile && !initialData?.hasPowerOfAttorney) {
        throw new Error("You must attach a Power of Attorney document when registering a new POA contact.");
      }

      let contactId: string;

      if (initialData?.patientContactId) {
        contactId = initialData.patientContactId;
        await updateContact({
          variables: {
            command: {
              ...form,
              patientContactId: contactId
            }
          }
        });
      } else {
        const result = await addContact({
          variables: {
            command: {
              ...form,
              patientId
            }
          }
        });
        contactId = result.data.addContact;
      }


      // Handle File Upload for POA
      if (form.hasPowerOfAttorney && selectedFile && contactId) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:34732';
        const uploadResponse = await fetch(`${baseUrl}/api/upload/poa/${contactId}`, {
          method: "POST",
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error("[AddContactDrawer] POA Upload Failed:", errorText);
          throw new Error(errorText || "POA Upload failed");
        }

        const uploadResult = await uploadResponse.json();
        console.log("[AddContactDrawer] POA Upload Successful:", uploadResult);
      }

      setIsSuccess(true);

      alert({
        title: "Registry Synchronized",
        message: initialData ? `${form.firstName}'s contact record has been updated.` : `${form.firstName} has been added to the trusted circle.`,
        type: "success"
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Failed to save contact or upload document", err);
      setLocalError(err.message || "An unexpected error occurred.");
    }
  };

  const handleDelete = async () => {
    if (!initialData?.patientContactId) return;

    const confirmed = await confirm({
      title: "Remove Contact?",
      message: `Are you sure you want to remove ${form.firstName} from the trusted circle? This action cannot be undone.`,
      type: "danger",
      confirmText: "Remove Permanently",
      cancelText: "Keep Contact"
    });

    if (confirmed) {
      try {
        await deleteContact({
          variables: {
            command: {
              patientContactId: initialData.patientContactId
            }
          }
        });
        onSuccess();
        onClose();
      } catch (err: any) {
        console.error("Failed to delete contact", err);
        setLocalError(err.message || "Failed to remove contact");
      }
    }
  };

  const loading = adding || updating || deleting;
  const error = addError || updateError;

  if (!isOpen) return null;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />

        <div className={`relative h-full w-full max-w-[450px] bg-[var(--sidebar-bg)] shadow-[-50px_0_150px_rgba(0,0,0,0.1)] 
          flex flex-col transition-transform duration-300 ease-out border-l border-[var(--card-border)]
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}>

          {/* Industrial Header */}
          <div className="h-20 w-full flex items-center justify-between px-8 bg-[var(--sidebar-bg)] border-b border-[var(--card-border)] shrink-0">
            <div className="flex items-center gap-6">
              <div className="w-1.5 h-10 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
              <div className="flex flex-col">
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none">
                  {initialData ? "Update Trusted Contact" : "Add Trusted Contact"}
                </h2>
                <span className="text-[10px] font-bold text-[var(--primary)] tracking-[0.2em] mt-1 uppercase">Governance · POA Registration</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[var(--input-bg)] rounded-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mx-8 mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4">
              <X className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-red-300/70 text-[11px] font-medium leading-relaxed">
                {error.message || "Failed to register contact."}
              </p>
            </div>
          )}

          {localError && (
            <div className="mx-8 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {localError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide pb-32">
            {/* Identity */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-[10px] font-bold text-[var(--text-primary)] tracking-[0.3em] uppercase">Identity & Relationship</h3>
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">First Name</label>
                  <input
                    required
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 px-4 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 transition-all uppercase"
                    value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Last Name</label>
                  <input
                    required
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 px-4 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 transition-all uppercase"
                    value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Relationship Type</label>
                <select
                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 px-4 text-xs font-bold text-[var(--text-primary)] appearance-none focus:outline-none focus:border-[var(--primary)]/50 transition-all uppercase"
                  value={form.relationship}
                  onChange={e => setForm({ ...form, relationship: e.target.value })}
                >
                  <option value="Spouse" className="bg-[var(--sidebar-bg)]">Spouse</option>
                  <option value="Child" className="bg-[var(--sidebar-bg)]">Child</option>
                  <option value="Parent" className="bg-[var(--sidebar-bg)]">Parent</option>
                  <option value="Sibling" className="bg-[var(--sidebar-bg)]">Sibling</option>
                  <option value="Relative" className="bg-[var(--sidebar-bg)]">Relative</option>
                  <option value="Friend" className="bg-[var(--sidebar-bg)]">Friend</option>
                  <option value="Lawyer" className="bg-[var(--sidebar-bg)]">Lawyer</option>
                  <option value="LegalRepresentative" className="bg-[var(--sidebar-bg)]">Legal Representative</option>
                  <option value="Other" className="bg-[var(--sidebar-bg)]">Other</option>
                </select>
              </div>
            </section>

            {/* Communications */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-[10px] font-bold text-[var(--text-primary)] tracking-[0.3em] uppercase">Communications</h3>
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)]" />
                    <input
                      required
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 transition-all"
                      value={form.phoneNumber}
                      onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                      placeholder="###-###-####"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)]" />
                    <input
                      type="email"
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 transition-all"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="EMAIL@EXAMPLE.COM"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Legal Governance */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-[10px] font-bold text-[var(--text-primary)] tracking-[0.3em] uppercase">Legal Governance</h3>
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer hover:bg-white/[0.04] transition-all">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[var(--card-border)] bg-black checked:bg-[var(--primary)] transition-all"
                    checked={form.isPrimaryContact}
                    onChange={e => setForm({ ...form, isPrimaryContact: e.target.checked })}
                  />
                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest">Primary Contact</p>
                    <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-tight">Main person to contact for alerts</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 cursor-pointer hover:bg-blue-500/10 transition-all">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-blue-500/20 bg-black checked:bg-blue-500 transition-all"
                    checked={form.hasPowerOfAttorney}
                    onChange={e => setForm({ ...form, hasPowerOfAttorney: e.target.checked })}
                  />
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Power of Attorney (POA)</p>
                    <p className="text-[9px] text-blue-400/50 uppercase tracking-tight">Authorized medical decision maker</p>
                  </div>
                </label>

                {form.hasPowerOfAttorney && (
                  <div className="mt-2 p-6 rounded-2xl bg-blue-500/5 border border-dashed border-blue-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">POA Documentation</p>
                        <p className="text-[9px] text-blue-400/50 uppercase tracking-tight">Upload signed legal authority (PDF)</p>
                      </div>
                    </div>

                    <div className="relative group">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={e => {
                          setSelectedFile(e.target.files?.[0] || null);
                          setLocalError(null);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full py-4 px-4 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-between group-hover:border-blue-500/30 transition-all">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase truncate pr-4">
                          {selectedFile ? selectedFile.name : (existingPoaFile ? `EXISTING: ${existingPoaFile}` : "Select POA File...")}
                        </span>
                        <Plus className="w-4 h-4 text-[var(--text-muted)] group-hover:text-blue-500 transition-all" />
                      </div>
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-3 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10 cursor-pointer hover:bg-purple-500/10 transition-all">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-purple-500/20 bg-black checked:bg-purple-500 transition-all"
                    checked={form.isLegalGuardian}
                    onChange={e => setForm({ ...form, isLegalGuardian: e.target.checked })}
                  />
                  <div>
                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Legal Guardian</p>
                    <p className="text-[9px] text-purple-400/50 uppercase tracking-tight">Court-appointed representative</p>
                  </div>
                </label>

              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Administrative Notes</label>
                <textarea
                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 px-4 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 transition-all h-24 resize-none"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="ADDITIONAL GOVERNANCE DETAILS..."
                />
              </div>
            </section>
          </form>

          <div className="p-8 bg-[var(--sidebar-bg)] border-t border-[var(--card-border)] mt-auto flex flex-col gap-4">
            {initialData && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="w-full py-3 rounded-xl border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Contact Record
              </button>
            )}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || isSuccess}
              className={`w-full py-4 rounded-xl font-bold text-[10px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 active:scale-[0.98]
                        ${isSuccess
                  ? "bg-emerald-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
                  : "bg-[var(--primary)] hover:opacity-90 disabled:opacity-50 text-white shadow-[0_10px_30px_var(--primary-glow)]"}`}
            >
              {loading ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : isSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 animate-in zoom-in duration-300" />
                  <span>REGISTRY UPDATED</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>REGISTER CONTACT</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}

