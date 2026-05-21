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
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setValidationError(null);
  }, [type, open, form]);

  useEffect(() => {
    if (initialData) {
      const { __typename, ...cleanData } = initialData;
      setForm(cleanData);
    } else {
      const initialForms: Record<string, any> = {
        practitioners: {
          firstName: "",
          lastName: "",
          position: "NURSE",
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
                region: "",
                country: "Philippines",
              },
              isPrimary: true,
              type: "HOME",
            },
          ],
        },
        facilities: {
          name: "",
          type: "HOSPITAL",
          facilityAddress: {
            street: "",
            city: "",
            state: "",
            postalCode: "",
            region: "",
            country: "Philippines",
          },
          isActive: true,
          npi: "",
          taxId: "",
          placeOfServiceCode: "11",
        },
        healthPlans: { name: "", code: "", isActive: true },
        medications: {
          name: "",
          strength: "",
          defaultRoute: "ORAL",
          isActive: true,
        },
        smartPhrases: {
          shortcut: "/",
          label: "",
          templateText: "",
          category: "General",
          isActive: true,
        },
        questionnaires: {
          name: "",
          assessmentType: "ESAS",
          schemaJson: "",
          isActive: true,
        },
        equipment: {
          modelName: "",
          serialNumber: "",
          type: "OXYGEN_CONCENTRATOR",
          status: "AVAILABLE",
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
          partner: "ELATION_HEALTH",
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

    // Validate required fields
    if (type === "practitioners") {
      if (!form.firstName?.trim()) {
        setValidationError("First Name is required.");
        return;
      }
      if (!form.lastName?.trim()) {
        setValidationError("Last Name is required.");
        return;
      }
      const addr = form.addresses?.[0]?.address;
      if (
        !addr ||
        !addr.street?.trim() ||
        !addr.city?.trim() ||
        !addr.state?.trim() ||
        !addr.postalCode?.trim() ||
        !addr.region?.trim()
      ) {
        setValidationError(
          "Base Operations Address: Street, City, Province, Zip, and Region are all required."
        );
        return;
      }
      if (form.licensures && Array.isArray(form.licensures)) {
        for (let i = 0; i < form.licensures.length; i++) {
          const lic = form.licensures[i];
          if (!lic.licenseNumber?.trim()) {
            setValidationError(`Licensure #${i + 1}: License number is required.`);
            return;
          }
          if (!lic.state?.trim()) {
            setValidationError(`Licensure #${i + 1}: Jurisdiction is required.`);
            return;
          }
          if (!lic.expiryDate) {
            setValidationError(`Licensure #${i + 1}: Expiry date is required.`);
            return;
          }
        }
      }
    } else if (type === "facilities") {
      if (!form.name?.trim()) {
        setValidationError("Facility Name is required.");
        return;
      }
      const addr = form.facilityAddress;
      if (
        !addr ||
        !addr.street?.trim() ||
        !addr.city?.trim() ||
        !addr.state?.trim() ||
        !addr.postalCode?.trim() ||
        !addr.region?.trim()
      ) {
        setValidationError(
          "Physical Location: Street, City, State, Zip, and Region are all required."
        );
        return;
      }
      if (!form.npi?.trim()) {
        setValidationError("Organizational NPI is required.");
        return;
      }
      if (form.npi.trim().length !== 10) {
        setValidationError("Organizational NPI must be exactly 10 digits.");
        return;
      }
      if (!form.taxId?.trim()) {
        setValidationError("Federal Tax ID (EIN) is required.");
        return;
      }
      if (!form.placeOfServiceCode?.trim()) {
        setValidationError("Place of Service (POS) Code is required.");
        return;
      }
    } else if (type === "healthPlans") {
      if (!form.name?.trim()) {
        setValidationError("Health Plan Name is required.");
        return;
      }
    } else if (type === "medications") {
      if (!form.name?.trim()) {
        setValidationError("Medication Name is required.");
        return;
      }
      if (!form.strength?.trim()) {
        setValidationError("Strength is required.");
        return;
      }
    } else if (type === "smartPhrases") {
      if (!form.shortcut?.trim()) {
        setValidationError("Shortcut is required.");
        return;
      }
      if (!form.shortcut.startsWith("/")) {
        setValidationError("Shortcut must start with a slash (/).");
        return;
      }
      if (!form.label?.trim()) {
        setValidationError("Label is required.");
        return;
      }
      if (!form.templateText?.trim()) {
        setValidationError("Template text is required.");
        return;
      }
    } else if (type === "questionnaires") {
      if (!form.name?.trim()) {
        setValidationError("Questionnaire Name is required.");
        return;
      }
    } else if (type === "equipment") {
      if (!form.modelName?.trim()) {
        setValidationError("Model Name is required.");
        return;
      }
      if (!form.serialNumber?.trim()) {
        setValidationError("Serial Number is required.");
        return;
      }
    } else if (type === "outreachScripts") {
      if (!form.scriptTitle?.trim()) {
        setValidationError("Script Title is required.");
        return;
      }
      if (!form.content?.trim()) {
        setValidationError("Script content is required.");
        return;
      }
    } else if (type === "integrationProfiles") {
      if (!form.apiKey?.trim()) {
        setValidationError("API Key is required.");
        return;
      }
      if (!form.baseUrl?.trim()) {
        setValidationError("Base URL is required.");
        return;
      }
    }

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

    // Automatically generate and inject the appropriate primary key ID if missing
    const idKeyMap: Record<string, string> = {
      practitioners: "practitionerId",
      facilities: "facilityId",
      healthPlans: "healthPlanId",
      medications: "medicationId",
      smartPhrases: "phraseId",
      questionnaires: "questionnaireId",
      equipment: "equipmentId",
      outreachScripts: "outreachScriptId",
      integrationProfiles: "integrationProfileId",
    };

    const idKey = idKeyMap[type];
    const generatedId = idKey ? (input[idKey] || crypto.randomUUID()) : null;
    if (idKey && generatedId) {
      input[idKey] = generatedId;
    }

    // Only align child collections for practitioner types
    if (type === "practitioners" && generatedId) {
      // Collection alignment
      if (input.addresses && Array.isArray(input.addresses)) {
        input.addresses = input.addresses.map((a: any) => ({
          ...a,
          practitionerId: generatedId,
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
          practitionerId: generatedId,
          licensureId: l.licensureId || crypto.randomUUID(),
          tenantId: l.tenantId || contextTenantId,
          isActive: l.isActive !== undefined ? l.isActive : true,
        }));
      }

      if (input.serviceAreas && Array.isArray(input.serviceAreas)) {
        input.serviceAreas = input.serviceAreas.map((s: any) => ({
          ...s,
          practitionerId: generatedId,
          serviceAreaId: s.serviceAreaId || crypto.randomUUID(),
          tenantId: s.tenantId || contextTenantId,
        }));
      }
    }

    // Final safety: Ensure isActive is present for types that support it
    const typesWithActive = [
      "practitioners",
      "healthPlans",
      "medications",
      "smartPhrases",
      "integrationProfiles",
    ];
    if (typesWithActive.includes(type)) {
      if (input.isActive === undefined || input.isActive === null) {
        input.isActive = true;
      }
    } else {
      delete input.isActive;
    }

    let payload = { ...input };
    if (type === "questionnaires") {
      payload = {
        questionnaireId: input.questionnaireId,
        tenantId: contextTenantId,
        name: input.name,
        assessmentType: input.assessmentType,
        schemaJson: input.schemaJson || null,
        description: input.description || null,
      } as any;
    }

    mutate({ variables: { input: payload } });
  };

  return {
    form,
    setForm,
    loading,
    error,
    validationError,
    handleSubmit,
  };
}
