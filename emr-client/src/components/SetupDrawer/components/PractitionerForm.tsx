"use client";

import React, { useState } from "react";
import { X, MapPin, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import dynamic from "next/dynamic";
import type { AddressData } from "@/components/EnrollmentDrawer/components/AddressMapModal";

const AddressMapModal = dynamic(
  () => import("@/components/EnrollmentDrawer/components/AddressMapModal"),
  { ssr: false }
);

interface PractitionerFormProps {
  form: any;
  onChange: (f: any) => void;
}

// Helper to get address state from practitioner form
function getAddressData(form: any): AddressData {
  const addr = form.addresses?.[0]?.address || {};
  return {
    street: addr.street || "",
    city: addr.city || "",
    state: addr.state || "",
    postalCode: addr.postalCode || "",
    region: addr.region || "",
    country: addr.country || "Philippines",
    latitude: addr.latitude ?? null,
    longitude: addr.longitude ?? null,
  };
}

// Update address back into form
function setAddressData(form: any, updated: AddressData) {
  const existing = form.addresses?.[0] || {
    entityAddressId: crypto.randomUUID(),
    isPrimary: true,
    type: "HOME",
  };
  return {
    ...form,
    addresses: [
      {
        ...existing,
        address: {
          street: updated.street,
          city: updated.city,
          state: updated.state,
          postalCode: updated.postalCode,
          region: updated.region,
          country: updated.country || "Philippines",
          latitude: updated.latitude,
          longitude: updated.longitude,
        },
      },
    ],
  };
}

// Returns status of license expiry
function getLicenseExpiry(expiryDate: string | null): {
  label: string;
  color: string;
  icon: React.ReactNode;
  daysLeft: number | null;
} {
  if (!expiryDate) return { label: "No expiry set", color: "text-[var(--text-muted)]", icon: null, daysLeft: null };
  const exp = new Date(expiryDate);
  const now = new Date();
  const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: `Expired ${Math.abs(daysLeft)}d ago`, color: "text-rose-500", icon: <AlertTriangle className="w-3 h-3" />, daysLeft };
  if (daysLeft <= 30) return { label: `Expires in ${daysLeft}d`, color: "text-amber-500", icon: <Clock className="w-3 h-3" />, daysLeft };
  return { label: `Valid · ${daysLeft}d left`, color: "text-emerald-500", icon: <CheckCircle className="w-3 h-3" />, daysLeft };
}

export default function PractitionerForm({ form, onChange }: PractitionerFormProps) {
  const [mapOpen, setMapOpen] = useState(false);

  const handleAddressFromMap = (updated: AddressData) => {
    onChange(setAddressData(form, updated));
    setMapOpen(false);
  };

  const handleAddressField = (field: keyof AddressData, value: string) => {
    const current = getAddressData(form);
    onChange(setAddressData(form, { ...current, [field]: value }));
  };

  const addr = getAddressData(form);

  return (
    <div className="space-y-8">
      {/* Basic Identity */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-[0.2em] border-b border-[var(--card-border)] pb-2">
          Basic Identity
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
              First Name
            </label>
            <input
              required
              placeholder="Enter first name..."
              className="premium-input w-full rounded-xl p-4 text-sm font-bold animate-in fade-in duration-300"
              value={form.firstName || ""}
              onChange={(e) => onChange({ ...form, firstName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
              Last Name
            </label>
            <input
              required
              placeholder="Enter last name..."
              className="premium-input w-full rounded-xl p-4 text-sm font-bold"
              value={form.lastName || ""}
              onChange={(e) => onChange({ ...form, lastName: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Position
            </label>
            <select
              className="premium-input w-full rounded-xl p-3 text-sm appearance-none cursor-pointer"
              value={form.position || "NURSE"}
              onChange={(e) => onChange({ ...form, position: e.target.value })}
            >
              <option value="NURSE" className="bg-[var(--sidebar-bg)]">Nurse</option>
              <option value="PHYSICIAN" className="bg-[var(--sidebar-bg)]">Physician</option>
              <option value="ADMIN" className="bg-[var(--sidebar-bg)]">Admin</option>
              <option value="SOCIAL_WORKER" className="bg-[var(--sidebar-bg)]">Social Worker</option>
              <option value="CHAPLAIN" className="bg-[var(--sidebar-bg)]">Chaplain</option>
              <option value="MEDICAL_DIRECTOR" className="bg-[var(--sidebar-bg)]">Medical Director</option>
              <option value="ADMIN_COORDINATOR" className="bg-[var(--sidebar-bg)]">Admin Coordinator</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              NPI Number
            </label>
            <input
              className="premium-input w-full rounded-xl p-3 text-sm font-mono"
              placeholder="10-digit NPI"
              value={form.npiNumber || ""}
              onChange={(e) => onChange({ ...form, npiNumber: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer hover:bg-[var(--divider-color)] transition-all">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-[var(--card-border)] text-[var(--primary)] focus:ring-[var(--primary)]"
              checked={!!form.isCareNavigator}
              onChange={(e) => onChange({ ...form, isCareNavigator: e.target.checked })}
            />
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Care Navigator
            </span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer hover:bg-[var(--divider-color)] transition-all">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-[var(--card-border)] text-[var(--primary)] focus:ring-[var(--primary)]"
              checked={!!form.isSupportingClinician}
              onChange={(e) => onChange({ ...form, isSupportingClinician: e.target.checked })}
            />
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Supporting Clinician
            </span>
          </label>
        </div>
      </div>

      {/* Clinical Governance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2">
          <h3 className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-[0.2em]">
            Clinical Governance
          </h3>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...form,
                licensures: [
                  ...(form.licensures || []),
                  {
                    licensureId: crypto.randomUUID(),
                    licenseNumber: "",
                    state: "",
                    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    isActive: true,
                  },
                ],
              })
            }
            className="text-[9px] font-bold text-[var(--primary)] hover:underline uppercase tracking-widest"
          >
            + Add License
          </button>
        </div>

        {(form.licensures || []).map((lic: any, idx: number) => {
          const expiry = getLicenseExpiry(lic.expiryDate);
          const isExpired = expiry.daysLeft !== null && expiry.daysLeft < 0;
          const isWarn = expiry.daysLeft !== null && expiry.daysLeft >= 0 && expiry.daysLeft <= 30;

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border space-y-3 relative group transition-colors ${
                isExpired
                  ? "bg-rose-500/5 border-rose-500/25"
                  : isWarn
                  ? "bg-amber-500/5 border-amber-500/25"
                  : "bg-[var(--input-bg)] border-[var(--card-border)]"
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...form,
                    licensures: form.licensures.filter((_: any, i: number) => i !== idx),
                  })
                }
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 transition-all p-1 rounded hover:bg-rose-500/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* License # and State */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
                    License #
                  </label>
                  <input
                    placeholder="e.g. 0123456"
                    className="premium-input w-full rounded-lg p-2 text-xs font-mono"
                    value={lic.licenseNumber || ""}
                    onChange={(e) => {
                      const newLics = [...form.licensures];
                      newLics[idx] = { ...newLics[idx], licenseNumber: e.target.value };
                      onChange({ ...form, licensures: newLics });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
                    Jurisdiction
                  </label>
                  <input
                    placeholder="Region / State"
                    className="premium-input w-full rounded-lg p-2 text-xs"
                    value={lic.state || ""}
                    onChange={(e) => {
                      const newLics = [...form.licensures];
                      newLics[idx] = { ...newLics[idx], state: e.target.value };
                      onChange({ ...form, licensures: newLics });
                    }}
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1 flex items-center gap-1.5">
                    <Calendar className="w-2.5 h-2.5" />
                    Expiry Date
                  </label>
                  {lic.expiryDate && (
                    <span className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-widest ${expiry.color}`}>
                      {expiry.icon}
                      {expiry.label}
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  className={`premium-input w-full rounded-lg p-2 text-xs font-mono ${
                    isExpired ? "border-rose-500/30 bg-rose-500/5 text-rose-400" :
                    isWarn   ? "border-amber-500/30 bg-amber-500/5 text-amber-400" : ""
                  }`}
                  value={lic.expiryDate ? lic.expiryDate.split("T")[0] : ""}
                  onChange={(e) => {
                    const newLics = [...form.licensures];
                    const val = e.target.value;
                    newLics[idx] = {
                      ...newLics[idx],
                      expiryDate: val ? new Date(val).toISOString() : "",
                    };
                    onChange({ ...form, licensures: newLics });
                  }}
                />
              </div>
            </div>
          );
        })}

        {(!form.licensures || form.licensures.length === 0) && (
          <p className="text-[10px] text-center text-[var(--text-muted)] italic py-2">
            No regional licensures defined.
          </p>
        )}
      </div>

      {/* Service Deployment Zones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2">
          <h3 className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-[0.2em]">
            Deployment Zones
          </h3>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...form,
                serviceAreas: [
                  ...(form.serviceAreas || []),
                  { serviceAreaId: crypto.randomUUID(), zipCode: "", county: "" },
                ],
              })
            }
            className="text-[9px] font-bold text-[var(--primary)] hover:underline uppercase tracking-widest"
          >
            + Add Zipcode
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(form.serviceAreas || []).map((area: any, idx: number) => (
            <div key={idx} className="flex gap-2">
              <input
                placeholder="Zipcode"
                className="premium-input flex-1 rounded-lg p-2 text-xs font-mono"
                value={area.zipCode || ""}
                onChange={(e) => {
                  const newAreas = [...form.serviceAreas];
                  newAreas[idx] = { ...newAreas[idx], zipCode: e.target.value };
                  onChange({ ...form, serviceAreas: newAreas });
                }}
              />
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...form,
                    serviceAreas: form.serviceAreas.filter((_: any, i: number) => i !== idx),
                  })
                }
                className="text-rose-500 hover:text-rose-400 p-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Base Operations Address */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2">
          <h3 className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-[0.2em]">
            Base Operations
          </h3>
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="flex items-center gap-1.5 text-[9px] font-bold text-teal-400 hover:text-teal-300 uppercase tracking-widest transition-colors hover:underline"
          >
            <MapPin className="w-3 h-3" />
            {addr.street ? "Edit on Map" : "Pin on Map"}
          </button>
        </div>

        {/* Compact address preview if lat/lng is set */}
        {addr.latitude != null && addr.longitude != null && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-500/5 border border-teal-500/20 text-[8px] font-bold text-teal-400 uppercase tracking-widest">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{addr.latitude.toFixed(5)}, {addr.longitude.toFixed(5)}</span>
            <span className="ml-auto text-teal-500/60">Pinned</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
              Street Address
            </label>
            <input
              placeholder="Street Address"
              className="premium-input w-full rounded-xl p-3 text-sm"
              value={addr.street}
              onChange={(e) => handleAddressField("street", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">City</label>
              <input
                placeholder="City"
                className="premium-input w-full rounded-lg p-2 text-xs"
                value={addr.city}
                onChange={(e) => handleAddressField("city", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Province</label>
              <input
                placeholder="State"
                className="premium-input w-full rounded-lg p-2 text-xs"
                value={addr.state}
                onChange={(e) => handleAddressField("state", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Zip</label>
              <input
                placeholder="Zip"
                className="premium-input w-full rounded-lg p-2 text-xs font-mono"
                value={addr.postalCode}
                onChange={(e) => handleAddressField("postalCode", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Region</label>
              <input
                placeholder="Region"
                className="premium-input w-full rounded-lg p-2 text-xs"
                value={addr.region}
                onChange={(e) => handleAddressField("region", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">Country</label>
              <input
                placeholder="Country"
                className="premium-input w-full rounded-lg p-2 text-xs"
                value={addr.country}
                onChange={(e) => handleAddressField("country", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Address Map Modal */}
      {mapOpen && (
        <AddressMapModal
          isOpen={mapOpen}
          onClose={() => setMapOpen(false)}
          address={addr}
          onSave={handleAddressFromMap}
        />
      )}
    </div>
  );
}
