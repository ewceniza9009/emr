import React from "react";
import { X } from "lucide-react";

interface PractitionerFormProps {
  form: any;
  onChange: (f: any) => void;
}

export default function PractitionerForm({
  form,
  onChange,
}: PractitionerFormProps) {
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
              value={form.position || "Nurse"}
              onChange={(e) => onChange({ ...form, position: e.target.value })}
            >
              <option value="Nurse" className="bg-[var(--sidebar-bg)]">
                Nurse
              </option>
              <option value="Physician" className="bg-[var(--sidebar-bg)]">
                Physician
              </option>
              <option value="Admin" className="bg-[var(--sidebar-bg)]">
                Admin
              </option>
              <option value="SocialWorker" className="bg-[var(--sidebar-bg)]">
                Social Worker
              </option>
              <option value="Chaplain" className="bg-[var(--sidebar-bg)]">
                Chaplain
              </option>
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
              onChange={(e) =>
                onChange({ ...form, isCareNavigator: e.target.checked })
              }
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
              onChange={(e) =>
                onChange({ ...form, isSupportingClinician: e.target.checked })
              }
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
                    expiryDate: new Date().toISOString(),
                  },
                ],
              })
            }
            className="text-[9px] font-bold text-[var(--primary)] hover:underline uppercase tracking-widest"
          >
            + Add License
          </button>
        </div>
        {(form.licensures || []).map((lic: any, idx: number) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-3 relative group"
          >
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...form,
                  licensures: form.licensures.filter(
                    (_: any, i: number) => i !== idx,
                  ),
                })
              }
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 transition-all text-[10px] font-bold uppercase"
            >
              Remove
            </button>
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="License #"
                className="premium-input w-full rounded-lg p-2 text-xs"
                value={lic.licenseNumber || ""}
                onChange={(e) => {
                  const newLics = [...form.licensures];
                  newLics[idx] = { ...newLics[idx], licenseNumber: e.target.value };
                  onChange({ ...form, licensures: newLics });
                }}
              />
              <input
                placeholder="State (e.g. CA)"
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
        ))}
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
                  {
                    serviceAreaId: crypto.randomUUID(),
                    zipCode: "",
                    county: "",
                  },
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
                    serviceAreas: form.serviceAreas.filter(
                      (_: any, i: number) => i !== idx,
                    ),
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
        <h3 className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-[0.2em] border-b border-[var(--card-border)] pb-2">
          Base Operations
        </h3>
        <div className="space-y-3">
          <input
            placeholder="Street Address"
            className="premium-input w-full rounded-xl p-3 text-sm"
            value={form.addresses?.[0]?.address?.street || ""}
            onChange={(e) => {
              const newAddrs = [
                ...(form.addresses || [
                  {
                    address: {
                      street: "",
                      city: "",
                      state: "",
                      postalCode: "",
                      country: "Philippines",
                    },
                  },
                ]),
              ];
              newAddrs[0] = {
                ...newAddrs[0],
                address: {
                  ...newAddrs[0].address,
                  street: e.target.value,
                },
              };
              onChange({ ...form, addresses: newAddrs });
            }}
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="City"
              className="premium-input w-full rounded-lg p-2 text-xs"
              value={form.addresses?.[0]?.address?.city || ""}
              onChange={(e) => {
                const newAddrs = [
                  ...(form.addresses || [
                    {
                      address: {
                        street: "",
                        city: "",
                        state: "",
                        postalCode: "",
                        country: "Philippines",
                      },
                    },
                  ]),
                ];
                newAddrs[0] = {
                  ...newAddrs[0],
                  address: {
                    ...newAddrs[0].address,
                    city: e.target.value,
                  },
                };
                onChange({ ...form, addresses: newAddrs });
              }}
            />
            <input
              placeholder="State"
              className="premium-input w-full rounded-lg p-2 text-xs"
              value={form.addresses?.[0]?.address?.state || ""}
              onChange={(e) => {
                const newAddrs = [
                  ...(form.addresses || [
                    {
                      address: {
                        street: "",
                        city: "",
                        state: "",
                        postalCode: "",
                        country: "Philippines",
                      },
                    },
                  ]),
                ];
                newAddrs[0] = {
                  ...newAddrs[0],
                  address: {
                    ...newAddrs[0].address,
                    state: e.target.value,
                  },
                };
                onChange({ ...form, addresses: newAddrs });
              }}
            />
            <input
              placeholder="Zip"
              className="premium-input w-full rounded-lg p-2 text-xs font-mono"
              value={form.addresses?.[0]?.address?.postalCode || ""}
              onChange={(e) => {
                const newAddrs = [
                  ...(form.addresses || [
                    {
                      address: {
                        street: "",
                        city: "",
                        state: "",
                        postalCode: "",
                        country: "Philippines",
                      },
                    },
                  ]),
                ];
                newAddrs[0] = {
                  ...newAddrs[0],
                  address: {
                    ...newAddrs[0].address,
                    postalCode: e.target.value,
                  },
                };
                onChange({ ...form, addresses: newAddrs });
              }}
            />
          </div>
          <input
            placeholder="Country"
            className="premium-input w-full rounded-lg p-2 text-xs"
            value={form.addresses?.[0]?.address?.country || "Philippines"}
            onChange={(e) => {
              const newAddrs = [
                ...(form.addresses || [
                  {
                    address: {
                      street: "",
                      city: "",
                      state: "",
                      postalCode: "",
                      country: "Philippines",
                    },
                  },
                ]),
              ];
              newAddrs[0] = {
                ...newAddrs[0],
                address: {
                  ...newAddrs[0].address,
                  country: e.target.value,
                },
              };
              onChange({ ...form, addresses: newAddrs });
            }}
          />
        </div>
      </div>
    </div>
  );
}
