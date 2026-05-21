import React, { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation } from "lucide-react";
import { AddressData } from "@/components/EnrollmentDrawer/components/AddressMapModal";

const AddressMapModal = dynamic(
  () => import("@/components/EnrollmentDrawer/components/AddressMapModal"),
  { ssr: false }
);

interface FacilityFormProps {
  form: any;
  onChange: (f: any) => void;
}

export default function FacilityForm({ form, onChange }: FacilityFormProps) {
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const currentAddressData: AddressData = {
    street: form.facilityAddress?.street || "",
    city: form.facilityAddress?.city || "",
    state: form.facilityAddress?.state || "",
    postalCode: form.facilityAddress?.postalCode || "",
    region: form.facilityAddress?.region || "",
    country: form.facilityAddress?.country || "Philippines",
    latitude: form.facilityAddress?.latitude || null,
    longitude: form.facilityAddress?.longitude || null,
  };

  const handleSaveAddress = (address: AddressData) => {
    onChange({
      ...form,
      facilityAddress: {
        ...form.facilityAddress,
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        postalCode: address.postalCode || "",
        region: address.region || "",
        country: address.country || "Philippines",
        latitude: address.latitude,
        longitude: address.longitude,
      },
    });
    setIsEditingAddress(false);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-[0.2em] border-b border-[var(--card-border)] pb-2">
            Facility Profile
          </h3>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
              Facility Name
            </label>
            <input
              required
              placeholder="Enter official facility name..."
              className="premium-input w-full rounded-xl p-4 text-sm font-bold"
              value={form.name || ""}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Type
            </label>
            <select
              className="premium-input w-full rounded-xl p-3 text-sm appearance-none cursor-pointer"
              value={form.type || "HOSPITAL"}
              onChange={(e) => onChange({ ...form, type: e.target.value })}
            >
              <option value="HOSPITAL" className="bg-[var(--sidebar-bg)]">
                Hospital
              </option>
              <option value="CLINIC" className="bg-[var(--sidebar-bg)]">
                Clinic
              </option>
              <option value="NURSING_HOME" className="bg-[var(--sidebar-bg)]">
                Nursing Home
              </option>
              <option value="ASSISTED_LIVING" className="bg-[var(--sidebar-bg)]">
                Assisted Living
              </option>
              <option value="HOSPICE_HOUSE" className="bg-[var(--sidebar-bg)]">
                Hospice House
              </option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2">
            <h3 className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-[0.2em]">
              Physical Location
            </h3>
            <button
              type="button"
              onClick={() => setIsEditingAddress(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              Pin on Map
            </button>
          </div>

          {form.facilityAddress?.latitude && form.facilityAddress?.longitude && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono w-fit animate-in fade-in duration-300">
              <Navigation className="w-3.5 h-3.5 rotate-45 text-emerald-400" />
              <span>{form.facilityAddress.latitude.toFixed(6)}, {form.facilityAddress.longitude.toFixed(6)}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                Street Address
              </label>
              <input
                placeholder="Street Address"
                className="premium-input w-full rounded-xl p-3 text-sm font-bold"
                value={form.facilityAddress?.street || ""}
                onChange={(e) =>
                  onChange({
                    ...form,
                    facilityAddress: {
                      ...form.facilityAddress,
                      street: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                  City
                </label>
                <input
                  placeholder="City"
                  className="premium-input w-full rounded-xl p-3 text-sm font-bold"
                  value={form.facilityAddress?.city || ""}
                  onChange={(e) =>
                    onChange({
                      ...form,
                      facilityAddress: {
                        ...form.facilityAddress,
                        city: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                  State
                </label>
                <input
                  placeholder="State"
                  className="premium-input w-full rounded-xl p-3 text-sm font-bold"
                  value={form.facilityAddress?.state || ""}
                  onChange={(e) =>
                    onChange({
                      ...form,
                      facilityAddress: {
                        ...form.facilityAddress,
                        state: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                  Zip
                </label>
                <input
                  placeholder="Zip"
                  className="premium-input w-full rounded-xl p-3 text-sm font-bold font-mono"
                  value={form.facilityAddress?.postalCode || ""}
                  onChange={(e) =>
                    onChange({
                      ...form,
                      facilityAddress: {
                        ...form.facilityAddress,
                        postalCode: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                  Region
                </label>
                <input
                  placeholder="Region"
                  className="premium-input w-full rounded-xl p-3 text-sm font-bold"
                  value={form.facilityAddress?.region || ""}
                  onChange={(e) =>
                    onChange({
                      ...form,
                      facilityAddress: {
                        ...form.facilityAddress,
                        region: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                  Country
                </label>
                <input
                  placeholder="Country"
                  className="premium-input w-full rounded-xl p-3 text-sm font-bold"
                  value={form.facilityAddress?.country || "Philippines"}
                  onChange={(e) =>
                    onChange({
                      ...form,
                      facilityAddress: {
                        ...form.facilityAddress,
                        country: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-[0.2em] border-b border-[var(--card-border)] pb-2">
            Contact Intelligence
          </h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                Contact Person
              </label>
              <input
                className="premium-input w-full rounded-xl p-3 text-sm font-bold"
                placeholder="Name"
                value={form.contactPerson || ""}
                onChange={(e) =>
                  onChange({ ...form, contactPerson: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                  Phone
                </label>
                <input
                  className="premium-input w-full rounded-xl p-3 text-sm font-bold font-mono"
                  placeholder="Phone"
                  value={form.contactPhone || ""}
                  onChange={(e) =>
                    onChange({ ...form, contactPhone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                  Email
                </label>
                <input
                  className="premium-input w-full rounded-xl p-3 text-sm font-bold"
                  placeholder="Email"
                  value={form.contactEmail || ""}
                  onChange={(e) =>
                    onChange({ ...form, contactEmail: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-[0.2em] border-b border-[var(--card-border)] pb-2">
            Clinical RCM & Billing Operations
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                  Organizational NPI
                </label>
                <input
                  className="premium-input w-full rounded-xl p-3 text-sm font-bold font-mono"
                  placeholder="10-digit NPI"
                  maxLength={10}
                  value={form.npi || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    onChange({ ...form, npi: val });
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                  Federal Tax ID (EIN)
                </label>
                <input
                  className="premium-input w-full rounded-xl p-3 text-sm font-bold font-mono"
                  placeholder="XX-XXXXXXX"
                  value={form.taxId || ""}
                  onChange={(e) => onChange({ ...form, taxId: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                Place of Service (POS) Code
              </label>
              <div className="relative">
                <select
                  className="premium-input w-full rounded-xl p-3 text-sm appearance-none cursor-pointer font-bold"
                  value={form.placeOfServiceCode || "11"}
                  onChange={(e) => onChange({ ...form, placeOfServiceCode: e.target.value })}
                >
                  <option value="11" className="bg-[var(--sidebar-bg)]">11 - Office (Clinic)</option>
                  <option value="21" className="bg-[var(--sidebar-bg)]">21 - Inpatient Hospital</option>
                  <option value="12" className="bg-[var(--sidebar-bg)]">12 - Home Care</option>
                  <option value="31" className="bg-[var(--sidebar-bg)]">31 - Skilled Nursing Facility</option>
                  <option value="32" className="bg-[var(--sidebar-bg)]">32 - Nursing Facility</option>
                  <option value="13" className="bg-[var(--sidebar-bg)]">13 - Assisted Living Facility</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AddressMapModal
        isOpen={isEditingAddress}
        onClose={() => setIsEditingAddress(false)}
        address={currentAddressData}
        onSave={handleSaveAddress}
      />
    </>
  );
}
