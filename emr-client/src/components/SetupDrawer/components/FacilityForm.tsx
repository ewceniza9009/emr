import React from "react";

interface FacilityFormProps {
  form: any;
  onChange: (f: any) => void;
}

export default function FacilityForm({ form, onChange }: FacilityFormProps) {
  return (
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
            value={form.type || "Hospital"}
            onChange={(e) => onChange({ ...form, type: e.target.value })}
          >
            <option value="Hospital" className="bg-[var(--sidebar-bg)]">
              Hospital
            </option>
            <option value="Clinic" className="bg-[var(--sidebar-bg)]">
              Clinic
            </option>
            <option value="HomeHealth" className="bg-[var(--sidebar-bg)]">
              Home Health
            </option>
            <option value="Hospice" className="bg-[var(--sidebar-bg)]">
              Hospice
            </option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-[0.2em] border-b border-[var(--card-border)] pb-2">
          Physical Location
        </h3>
        <div className="space-y-3">
          <input
            placeholder="Street Address"
            className="premium-input w-full rounded-xl p-3 text-sm"
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
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="City"
              className="premium-input w-full rounded-lg p-2 text-xs"
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
            <input
              placeholder="State"
              className="premium-input w-full rounded-lg p-2 text-xs"
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
            <input
              placeholder="Zip"
              className="premium-input w-full rounded-lg p-2 text-xs font-mono"
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
              className="premium-input w-full rounded-xl p-3 text-sm"
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
                className="premium-input w-full rounded-xl p-3 text-sm font-mono"
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
                className="premium-input w-full rounded-xl p-3 text-sm"
                value={form.contactEmail || ""}
                onChange={(e) =>
                  onChange({ ...form, contactEmail: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
