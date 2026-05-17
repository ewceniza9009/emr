"use client";

import { useState, useEffect } from "react";
import { useMutation, gql } from "@apollo/client";
import {
  X,
  Building2,
  Save,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Activity,
} from "lucide-react";
import HalcyonPortal from "./Portal";
import { PermissionGate } from "./PermissionGate";

const UPDATE_FACILITY = gql`
  mutation UpdateFacility($input: FacilityInput!) {
    updateFacility(input: $input)
  }
`;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  facility: any | null;
}

export default function EditFacilityDrawer({
  open,
  onClose,
  onSuccess,
  facility,
}: Props) {
  const [form, setForm] = useState({
    facilityId: "",
    name: "",
    type: "CLINIC",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    city: "",
    street: "",
  });

  useEffect(() => {
    if (facility) {
      setForm({
        facilityId: facility.facilityId,
        name: facility.name || "",
        type: facility.type || "CLINIC",
        contactPerson: facility.contactPerson || "",
        contactPhone: facility.contactPhone || "",
        contactEmail: facility.contactEmail || "",
        city: facility.facilityAddress?.city || "",
        street: facility.facilityAddress?.street || "",
      });
    }
  }, [facility]);

  const [updateFacility, { loading, error: mutationError }] = useMutation(
    UPDATE_FACILITY,
    {
      onCompleted: () => {
        onSuccess();
        onClose();
      },
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFacility({
      variables: {
        input: {
          facilityId: form.facilityId,
          name: form.name,
          type: form.type || "CLINIC",
          contactPerson: form.contactPerson,
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail,
          facilityAddress: {
            street: form.street || "",
            city: form.city || "",
            state: "",
            postalCode: "",
            country: "Philippines",
          },
        },
      },
    }).catch((e) => console.error("Update failed", e));
  };

  if (!open) return null;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden">
        <div
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300"
          onClick={onClose}
        />

        <div
          className={`relative h-full w-full max-w-[500px] bg-[var(--sidebar-bg)] shadow-[-50px_0_150px_rgba(0,0,0,0.1)] 
          flex flex-col transition-transform duration-300 ease-out border-l border-[var(--card-border)]
          ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          {/* Header */}
          <div className="h-20 w-full flex items-center justify-between px-8 bg-[var(--sidebar-bg)] border-b border-[var(--card-border)] shrink-0">
            <div className="flex items-center gap-6">
              <div className="w-1.5 h-10 bg-[var(--primary)] rounded-full shadow-[0_0_20px_var(--primary-glow)]" />
              <div className="flex flex-col">
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight leading-none">
                  Configure Facility
                </h2>
                <span className="text-[10px] font-black text-[var(--primary)] tracking-[0.2em] mt-1 uppercase">
                  Infrastructure Registry · Site Meta
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--primary)]/10 rounded-xl transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {mutationError && (
            <div className="mx-10 mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4 animate-in fade-in">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                <X className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 font-black text-[10px] uppercase tracking-widest mb-1">
                  Update Blocked
                </p>
                <p className="text-red-300/70 text-[11px] leading-relaxed">
                  {mutationError.message}
                </p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide"
          >
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <Building2 className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="text-xs font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">
                  Facility Identity
                </h3>
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Facility Official Name
                </label>
                <input
                  required
                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 px-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest shadow-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Classification Type
                </label>
                <select
                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 px-4 text-xs font-black text-[var(--text-primary)] appearance-none focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest shadow-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="HOSPITAL">Hospital</option>
                  <option value="NURSING_HOME">Nursing Home</option>
                  <option value="ASSISTED_LIVING">Assisted Living</option>
                  <option value="HOSPICE_HOUSE">Hospice House</option>
                  <option value="CLINIC">Clinic</option>
                </select>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <User className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">
                  Primary Contact
                </h3>
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  Coordinator Name
                </label>
                <input
                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 px-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest shadow-sm"
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm({ ...form, contactPerson: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Phone Line
                  </label>
                  <input
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 px-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest shadow-sm"
                    value={form.contactPhone}
                    onChange={(e) =>
                      setForm({ ...form, contactPhone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 px-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest shadow-sm"
                    value={form.contactEmail}
                    onChange={(e) =>
                      setForm({ ...form, contactEmail: e.target.value })
                    }
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6 pb-10">
              <div className="flex items-center gap-4">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black text-[var(--text-primary)] tracking-[0.3em] uppercase">
                  Geospatial Placement
                </h3>
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    City Hub
                  </label>
                  <input
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 px-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest shadow-sm"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Street/Sector
                  </label>
                  <input
                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3.5 px-4 text-xs font-black text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]/50 focus:bg-[var(--primary)]/5 transition-all uppercase tracking-widest shadow-sm"
                    value={form.street}
                    onChange={(e) =>
                      setForm({ ...form, street: e.target.value })
                    }
                  />
                </div>
              </div>
            </section>
          </form>

          <div className="p-8 bg-[var(--sidebar-bg)] border-t border-[var(--card-border)] mt-auto">
            <PermissionGate permission="setup:manage">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-[var(--primary)] hover:opacity-90 disabled:opacity-50 text-white font-black text-sm uppercase tracking-[0.4em] transition-all shadow-[0_10px_30px_var(--primary-glow)] flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {loading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save</span>
                  </>
                )}
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}
