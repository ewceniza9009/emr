import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { SetupDrawerProps } from "../types";
import { MUTATIONS, UPDATE_MUTATIONS } from "../queries";

export default function useSetupState({
  open,
  type,
  initialData,
  onClose,
  onSuccess,
  tenantId,
}: SetupDrawerProps) {
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (initialData) {
      const { __typename, ...cleanData } = initialData;
      setForm(cleanData);
    } else {
      const initialForms: Record<string, any> = {
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const input = cleanTypenames(form);
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

  return {
    form,
    setForm,
    loading,
    error,
    handleSubmit,
  };
}
