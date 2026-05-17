import { gql } from "@apollo/client";

export const MUTATIONS = {
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

export const UPDATE_MUTATIONS = {
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
