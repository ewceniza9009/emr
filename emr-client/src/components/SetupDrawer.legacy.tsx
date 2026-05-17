"use client";

import { useState, useEffect } from "react";
import { useMutation, gql } from "@apollo/client";
import {
  X,
  Save,
  Activity,
  CheckCircle,
  Shield,
  Building2,
  Stethoscope,
  Pill,
  Zap,
  MessageSquare,
} from "lucide-react";
import HalcyonPortal from "./Portal";
import { PermissionGate } from "./PermissionGate";

const MUTATIONS = {
  practitioners: gql`
    mutation CreatePractitioner($input: PractitionerInput!) {
      createPractitioner(input: $input) {
        practitionerId
      }
    }
  `,
  facilities: gql`
    mutation CreateFacility($input: FacilityInput!) {
      createFacility(input: $input) {
        facilityId
      }
    }
  `,
  healthPlans: gql`
    mutation CreateHealthPlan($input: HealthPlanInput!) {
      createHealthPlan(input: $input) {
        healthPlanId
      }
    }
  `,
  medications: gql`
    mutation CreateMedication($input: MedicationInput!) {
      createMedication(input: $input) {
        medicationId
      }
    }
  `,
  smartPhrases: gql`
    mutation CreateSmartPhrase($input: SmartPhraseInput!) {
      createSmartPhrase(input: $input) {
        phraseId
      }
    }
  `,
  questionnaires: gql`
    mutation CreateQuestionnaire($input: QuestionnaireInput!) {
      createQuestionnaire(input: $input) {
        questionnaireId
        name
        schemaJson
      }
    }
  `,
  equipment: gql`
    mutation CreateEquipment($input: DurableMedicalEquipmentInput!) {
      createEquipment(input: $input) {
        equipmentId
      }
    }
  `,
  outreachScripts: gql`
    mutation CreateOutreachScript($input: OutreachScriptInput!) {
      createOutreachScript(input: $input) {
        outreachScriptId
      }
    }
  `,
  integrationProfiles: gql`
    mutation CreateIntegrationProfile($input: IntegrationProfileInput!) {
      createIntegrationProfile(input: $input) {
        integrationProfileId
      }
    }
  `,
};

const UPDATE_MUTATIONS = {
  practitioners: gql`
    mutation UpdatePractitioner($input: PractitionerInput!) {
      updatePractitioner(input: $input)
    }
  `,
  facilities: gql`
    mutation UpdateFacility($input: FacilityInput!) {
      updateFacility(input: $input)
    }
  `,
  healthPlans: gql`
    mutation UpdateHealthPlan($input: HealthPlanInput!) {
      updateHealthPlan(input: $input)
    }
  `,
  medications: gql`
    mutation UpdateMedication($input: MedicationInput!) {
      updateMedication(input: $input)
    }
  `,
  smartPhrases: gql`
    mutation UpdateSmartPhrase($input: SmartPhraseInput!) {
      updateSmartPhrase(input: $input)
    }
  `,
  questionnaires: gql`
    mutation UpdateQuestionnaire($input: QuestionnaireInput!) {
      updateQuestionnaire(input: $input)
    }
  `,
  equipment: gql`
    mutation UpdateEquipment($input: DurableMedicalEquipmentInput!) {
      updateEquipment(input: $input)
    }
  `,
  outreachScripts: gql`
    mutation UpdateOutreachScript($input: OutreachScriptInput!) {
      updateOutreachScript(input: $input)
    }
  `,
  integrationProfiles: gql`
    mutation UpdateIntegrationProfile($input: IntegrationProfileInput!) {
      updateIntegrationProfile(input: $input)
    }
  `,
};

interface Props {
  open: boolean;
  type:
    | "practitioners"
    | "facilities"
    | "healthPlans"
    | "medications"
    | "smartPhrases"
    | "questionnaires"
    | "equipment"
    | "outreachScripts"
    | "integrationProfiles";
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
  tenantId?: string;
}

export default function SetupDrawer({
  open,
  type,
  initialData,
  onClose,
  onSuccess,
  tenantId,
}: Props) {
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (initialData) {
      const { __typename, ...cleanData } = initialData;
      setForm(cleanData);
    } else {
      const initialForms = {
        practitioners: {
          firstName: "",
          lastName: "",
          position: "Nurse",
          prcLicenseNumber: "",
          npiNumber: "",
          isActive: true,
          isCareNavigator: false,
          isSupportingClinician: false,
          tenantId: tenantId,
          addresses: [
            {
              entityAddressId: crypto.randomUUID(),
              tenantId: tenantId,
              address: {
                street: "",
                city: "",
                state: "",
                postalCode: "",
                country: "Philippines",
              },
              isPrimary: true,
              type: "HOME",
            },
          ],
        },
        facilities: {
          name: "",
          type: "Hospital",
          facilityAddress: {
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "Philippines",
          },
          isActive: true,
        },
        healthPlans: { name: "", code: "", isActive: true },
        medications: {
          name: "",
          strength: "",
          defaultRoute: "Oral",
          isActive: true,
        },
        smartPhrases: {
          shortcut: "/",
          label: "",
          templateText: "",
          isActive: true,
        },
        questionnaires: {
          name: "",
          assessmentType: "Esas",
          schemaJson: "",
          isActive: true,
        },
        equipment: {
          modelName: "",
          serialNumber: "",
          type: "VitalsMonitor",
          status: "Available",
          isActive: true,
        },
        outreachScripts: {
          scriptTitle: "",
          locationName: "",
          postalCode: "",
          content: "",
          isDefault: false,
          isActive: true,
        },
        integrationProfiles: {
          partner: "ElationHealth",
          apiKey: "",
          baseUrl: "",
          isActive: true,
        },
      };
      setForm(initialForms[type] || {});
    }
  }, [type, open, initialData, tenantId]);

  const mutation = initialData ? UPDATE_MUTATIONS[type] : MUTATIONS[type];

  const [mutate, { loading, error }] = useMutation(mutation, {
    onCompleted: () => {
      onSuccess();
      onClose();
    },
  });

  const cleanTypenames = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(cleanTypenames);
    if (obj !== null && typeof obj === "object") {
      const newObj: any = {};
      const stripFields = [
        "__typename",
        "createdAt",
        "updatedAt",
        "createdBy",
        "updatedBy",
        "isDeleted",
      ];
      for (const key in obj) {
        if (!stripFields.includes(key)) newObj[key] = cleanTypenames(obj[key]);
      }
      return newObj;
    }
    return obj;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let input = cleanTypenames(form);
    const contextTenantId =
      tenantId || input.tenantId || "a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0";

    // Strip metadata fields that are now ignored in GraphQL schema
    const metadataFields = [
      "createdAt",
      "updatedAt",
      "createdBy",
      "updatedBy",
      "isDeleted",
    ];
    metadataFields.forEach((f) => delete input[f]);

    // Top-level tenant and audit alignment
    if (!input.tenantId) input.tenantId = contextTenantId;

    const now = new Date().toISOString();

    // Only inject practitionerId for practitioner types
    if (type === "practitioners") {
      const pId = input.practitionerId || crypto.randomUUID();
      input.practitionerId = pId;

      // Collection alignment
      if (input.addresses && Array.isArray(input.addresses)) {
        input.addresses = input.addresses.map((a: any) => ({
          ...a,
          practitionerId: pId,
          entityAddressId: a.entityAddressId || crypto.randomUUID(),
          tenantId: a.tenantId || contextTenantId,
          type: (a.type || "HOME").toUpperCase(),
          isPrimary: a.isPrimary !== undefined ? a.isPrimary : true,
          address: {
            ...a.address,
            country: a.address?.country || "Philippines",
          },
        }));
      }

      if (input.licensures && Array.isArray(input.licensures)) {
        input.licensures = input.licensures.map((l: any) => ({
          ...l,
          practitionerId: pId,
          licensureId: l.licensureId || crypto.randomUUID(),
          tenantId: l.tenantId || contextTenantId,
          isActive: l.isActive !== undefined ? l.isActive : true,
        }));
      }

      if (input.serviceAreas && Array.isArray(input.serviceAreas)) {
        input.serviceAreas = input.serviceAreas.map((s: any) => ({
          ...s,
          practitionerId: pId,
          serviceAreaId: s.serviceAreaId || crypto.randomUUID(),
          tenantId: s.tenantId || contextTenantId,
        }));
      }
    }

    // Final safety: Ensure isActive is present for all types if it exists in the model
    if (input.isActive === undefined || input.isActive === null) {
      input.isActive = true;
    }

    mutate({ variables: { input } });
  };

  if (!open) return null;

  const title = type
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .slice(0, -1);
  const isEdit = !!initialData;
  const Icon =
    {
      practitioners: Shield,
      facilities: Building2,
      healthPlans: Stethoscope,
      medications: Pill,
      smartPhrases: Activity,
      questionnaires: CheckCircle,
      equipment: Zap,
      outreachScripts: MessageSquare,
      integrationProfiles: Shield,
    }[type] || Zap;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end overflow-hidden">
        <div
          className="absolute inset-0 bg-[var(--background)]/40 backdrop-blur-md animate-in fade-in duration-300"
          onClick={onClose}
        />

        <div className="relative h-full w-full max-w-[450px] bg-[var(--sidebar-bg)] border-l border-[var(--card-border)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          <div className="h-20 px-8 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--sidebar-bg)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">
                  {isEdit ? "Edit" : "New"} {title}
                </h2>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                  Setup Registry · Clinical Master
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--input-bg)] rounded-xl transition-all"
            >
              <X className="w-6 h-6 text-[var(--text-muted)]" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-8 space-y-6"
          >
            {type === "practitioners" && (
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
                        className="premium-input w-full rounded-xl p-4 text-sm font-bold"
                        value={form.firstName}
                        onChange={(e) =>
                          setForm({ ...form, firstName: e.target.value })
                        }
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
                        value={form.lastName}
                        onChange={(e) =>
                          setForm({ ...form, lastName: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        Position
                      </label>
                      <select
                        className="premium-input w-full rounded-xl p-3 text-sm appearance-none"
                        value={form.position}
                        onChange={(e) =>
                          setForm({ ...form, position: e.target.value })
                        }
                      >
                        <option
                          value="Nurse"
                          className="bg-[var(--sidebar-bg)]"
                        >
                          Nurse
                        </option>
                        <option
                          value="Physician"
                          className="bg-[var(--sidebar-bg)]"
                        >
                          Physician
                        </option>
                        <option
                          value="Admin"
                          className="bg-[var(--sidebar-bg)]"
                        >
                          Admin
                        </option>
                        <option
                          value="SocialWorker"
                          className="bg-[var(--sidebar-bg)]"
                        >
                          Social Worker
                        </option>
                        <option
                          value="Chaplain"
                          className="bg-[var(--sidebar-bg)]"
                        >
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
                        onChange={(e) =>
                          setForm({ ...form, npiNumber: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] cursor-pointer hover:bg-[var(--divider-color)] transition-all">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-[var(--card-border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                        checked={form.isCareNavigator}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            isCareNavigator: e.target.checked,
                          })
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
                        checked={form.isSupportingClinician}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            isSupportingClinician: e.target.checked,
                          })
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
                        setForm({
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
                          setForm({
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
                          value={lic.licenseNumber}
                          onChange={(e) => {
                            const newLics = [...form.licensures];
                            newLics[idx].licenseNumber = e.target.value;
                            setForm({ ...form, licensures: newLics });
                          }}
                        />
                        <input
                          placeholder="State (e.g. CA)"
                          className="premium-input w-full rounded-lg p-2 text-xs"
                          value={lic.state}
                          onChange={(e) => {
                            const newLics = [...form.licensures];
                            newLics[idx].state = e.target.value;
                            setForm({ ...form, licensures: newLics });
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
                        setForm({
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
                          value={area.zipCode}
                          onChange={(e) => {
                            const newAreas = [...form.serviceAreas];
                            newAreas[idx].zipCode = e.target.value;
                            setForm({ ...form, serviceAreas: newAreas });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
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
                              },
                            },
                          ]),
                        ];
                        newAddrs[0].address = {
                          ...newAddrs[0].address,
                          street: e.target.value,
                        };
                        setForm({ ...form, addresses: newAddrs });
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
                                },
                              },
                            ]),
                          ];
                          newAddrs[0].address = {
                            ...newAddrs[0].address,
                            city: e.target.value,
                          };
                          setForm({ ...form, addresses: newAddrs });
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
                                },
                              },
                            ]),
                          ];
                          newAddrs[0].address = {
                            ...newAddrs[0].address,
                            state: e.target.value,
                          };
                          setForm({ ...form, addresses: newAddrs });
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
                          newAddrs[0].address = {
                            ...newAddrs[0].address,
                            postalCode: e.target.value,
                          };
                          setForm({ ...form, addresses: newAddrs });
                        }}
                      />
                    </div>
                    <input
                      placeholder="Country"
                      className="premium-input w-full rounded-lg p-2 text-xs"
                      value={
                        form.addresses?.[0]?.address?.country || "Philippines"
                      }
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
                        newAddrs[0].address = {
                          ...newAddrs[0].address,
                          country: e.target.value,
                        };
                        setForm({ ...form, addresses: newAddrs });
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {type === "facilities" && (
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
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                      Type
                    </label>
                    <select
                      className="premium-input w-full rounded-xl p-3 text-sm appearance-none"
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value })
                      }
                    >
                      <option
                        value="Hospital"
                        className="bg-[var(--sidebar-bg)]"
                      >
                        Hospital
                      </option>
                      <option value="Clinic" className="bg-[var(--sidebar-bg)]">
                        Clinic
                      </option>
                      <option
                        value="HomeHealth"
                        className="bg-[var(--sidebar-bg)]"
                      >
                        Home Health
                      </option>
                      <option
                        value="Hospice"
                        className="bg-[var(--sidebar-bg)]"
                      >
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
                        setForm({
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
                          setForm({
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
                          setForm({
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
                          setForm({
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
                          setForm({ ...form, contactPerson: e.target.value })
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
                            setForm({ ...form, contactPhone: e.target.value })
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
                            setForm({ ...form, contactEmail: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {type === "healthPlans" && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
                    Plan Name
                  </label>
                  <input
                    required
                    placeholder="Enter official health plan name..."
                    className="premium-input w-full rounded-xl p-4 text-sm font-bold shadow-sm"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
                    Plan Code
                  </label>
                  <input
                    required
                    placeholder="Unique alphanumeric identifier..."
                    className="premium-input w-full rounded-xl p-4 text-sm font-mono shadow-sm"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
              </div>
            )}

            {type === "medications" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
                    Medication Name
                  </label>
                  <input
                    required
                    placeholder="Generic or Brand name..."
                    className="premium-input w-full rounded-xl p-4 text-sm font-bold"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
                    Strength
                  </label>
                  <input
                    required
                    placeholder="e.g. 500mg, 10ml..."
                    className="premium-input w-full rounded-xl p-4 text-sm font-mono"
                    value={form.strength}
                    onChange={(e) =>
                      setForm({ ...form, strength: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Default Route
                  </label>
                  <select
                    className="premium-input w-full rounded-xl p-3 text-sm"
                    value={form.defaultRoute}
                    onChange={(e) =>
                      setForm({ ...form, defaultRoute: e.target.value })
                    }
                  >
                    <option value="Oral" className="bg-[var(--sidebar-bg)]">
                      Oral
                    </option>
                    <option
                      value="Sublingual"
                      className="bg-[var(--sidebar-bg)]"
                    >
                      Sublingual
                    </option>
                    <option
                      value="Transdermal"
                      className="bg-[var(--sidebar-bg)]"
                    >
                      Transdermal
                    </option>
                    <option
                      value="Subcutaneous"
                      className="bg-[var(--sidebar-bg)]"
                    >
                      Subcutaneous
                    </option>
                    <option
                      value="Intravenous"
                      className="bg-[var(--sidebar-bg)]"
                    >
                      Intravenous
                    </option>
                  </select>
                </div>
              </>
            )}

            {type === "smartPhrases" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
                    Trigger Shortcut (e.g. /soap)
                  </label>
                  <input
                    required
                    placeholder="/trigger..."
                    className="premium-input w-full rounded-xl p-4 text-sm font-mono text-[var(--primary)]"
                    value={form.shortcut}
                    onChange={(e) =>
                      setForm({ ...form, shortcut: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
                    Label
                  </label>
                  <input
                    placeholder="Short descriptive label..."
                    className="premium-input w-full rounded-xl p-4 text-sm font-bold"
                    value={form.label}
                    onChange={(e) =>
                      setForm({ ...form, label: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
                    Template Text
                  </label>
                  <textarea
                    required
                    placeholder="Write clinical template here..."
                    rows={4}
                    className="premium-input w-full rounded-xl p-4 text-sm leading-relaxed"
                    value={form.templateText}
                    onChange={(e) =>
                      setForm({ ...form, templateText: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {type === "questionnaires" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Form Name
                  </label>
                  <input
                    required
                    className="premium-input w-full rounded-xl p-3 text-sm"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Assessment Type
                  </label>
                  <select
                    className="premium-input w-full rounded-xl p-3 text-sm"
                    value={form.assessmentType}
                    onChange={(e) =>
                      setForm({ ...form, assessmentType: e.target.value })
                    }
                  >
                    <option value="Esas" className="bg-[var(--sidebar-bg)]">
                      ESAS
                    </option>
                    <option value="Bpi" className="bg-[var(--sidebar-bg)]">
                      BPI
                    </option>
                    <option value="Msas" className="bg-[var(--sidebar-bg)]">
                      MSAS
                    </option>
                    <option value="Pps" className="bg-[var(--sidebar-bg)]">
                      PPS
                    </option>
                    <option value="Kps" className="bg-[var(--sidebar-bg)]">
                      KPS
                    </option>
                    <option value="Ecog" className="bg-[var(--sidebar-bg)]">
                      ECOG
                    </option>
                    <option value="Phq9" className="bg-[var(--sidebar-bg)]">
                      PHQ-9
                    </option>
                    <option value="Hads" className="bg-[var(--sidebar-bg)]">
                      HADS
                    </option>
                  </select>
                </div>
              </>
            )}

            {type === "equipment" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Model Name
                  </label>
                  <input
                    required
                    className="premium-input w-full rounded-xl p-3 text-sm"
                    value={form.modelName}
                    onChange={(e) =>
                      setForm({ ...form, modelName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Serial Number
                  </label>
                  <input
                    required
                    className="premium-input w-full rounded-xl p-3 text-sm font-mono"
                    value={form.serialNumber}
                    onChange={(e) =>
                      setForm({ ...form, serialNumber: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Equipment Type
                  </label>
                  <select
                    className="premium-input w-full rounded-xl p-3 text-sm"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option
                      value="VitalsMonitor"
                      className="bg-[var(--sidebar-bg)]"
                    >
                      Vitals Monitor
                    </option>
                    <option
                      value="OxygenConcentrator"
                      className="bg-[var(--sidebar-bg)]"
                    >
                      Oxygen Concentrator
                    </option>
                    <option
                      value="HospitalBed"
                      className="bg-[var(--sidebar-bg)]"
                    >
                      Hospital Bed
                    </option>
                    <option
                      value="Wheelchair"
                      className="bg-[var(--sidebar-bg)]"
                    >
                      Wheelchair
                    </option>
                    <option
                      value="InfusionPump"
                      className="bg-[var(--sidebar-bg)]"
                    >
                      Infusion Pump
                    </option>
                  </select>
                </div>
              </>
            )}

            {type === "outreachScripts" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
                    Script Title
                  </label>
                  <input
                    required
                    placeholder="Enter descriptive script title..."
                    className="premium-input w-full rounded-xl p-4 text-sm font-bold"
                    value={form.scriptTitle}
                    onChange={(e) =>
                      setForm({ ...form, scriptTitle: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
                    Target Location (City/Region)
                  </label>
                  <input
                    required
                    placeholder="Region VII, Mandaue, etc..."
                    className="premium-input w-full rounded-xl p-4 text-sm"
                    value={form.locationName}
                    onChange={(e) =>
                      setForm({ ...form, locationName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-1">
                    Script Content
                  </label>
                  <textarea
                    required
                    placeholder="Draft clinical outreach script content..."
                    rows={6}
                    className="premium-input w-full rounded-xl p-4 text-sm leading-relaxed"
                    value={form.content}
                    onChange={(e) =>
                      setForm({ ...form, content: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {type === "integrationProfiles" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Integration Partner
                  </label>
                  <select
                    className="premium-input w-full rounded-xl p-3 text-sm"
                    value={form.partner}
                    onChange={(e) =>
                      setForm({ ...form, partner: e.target.value })
                    }
                  >
                    <option
                      value="ElationHealth"
                      className="bg-[var(--sidebar-bg)]"
                    >
                      Elation Health
                    </option>
                    <option
                      value="CareSource"
                      className="bg-[var(--sidebar-bg)]"
                    >
                      CareSource
                    </option>
                    <option
                      value="Surescripts"
                      className="bg-[var(--sidebar-bg)]"
                    >
                      Surescripts
                    </option>
                    <option
                      value="HealthGorilla"
                      className="bg-[var(--sidebar-bg)]"
                    >
                      Health Gorilla
                    </option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    API Key
                  </label>
                  <input
                    required
                    type="password"
                    className="premium-input w-full rounded-xl p-3 text-sm"
                    value={form.apiKey}
                    onChange={(e) =>
                      setForm({ ...form, apiKey: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Base URL (Optional)
                  </label>
                  <input
                    className="premium-input w-full rounded-xl p-3 text-sm"
                    value={form.baseUrl}
                    onChange={(e) =>
                      setForm({ ...form, baseUrl: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                {error.message}
              </div>
            )}
          </form>

          <div className="p-8 border-t border-[var(--card-border)] bg-[var(--sidebar-bg)]">
            <PermissionGate permission="setup:manage">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-[var(--primary)] text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-[var(--primary-glow)] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" /> <span>Save</span>
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
