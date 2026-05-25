import { gql } from "@apollo/client";

export const GET_NOTES_DATA = gql`
  query GetNotesData {
    appointments {
      items {
        appointmentId
        patientId
        scheduledStart
        status
        patient {
          firstName
          lastName
          mrn
        }
        practitioner {
          practitionerId
          firstName
          lastName
        }
        encounters {
          encounterId
          clinicalNotes {
            noteId
            subjective
            objective
            assessment
            plan
            content
            isSigned
          }
        }
      }
    }
    smartPhrases {
      shortcut
      label
      templateText
    }
  }
`;

export const GET_PATIENT_CLINICAL_DETAILS = gql`
  query GetPatientClinicalDetails($patientId: UUID!) {
    encountersByPatient(patientId: $patientId) {
      encounterId
      type
      encounterDate
      vitalSigns {
        vitalId
        heartRate
        bloodPressureSystolic
        bloodPressureDiastolic
        respiratoryRate
        oxygenSaturation
        temperature
        weight
        recordedAt
      }
    }
    allergiesByPatient(patientId: $patientId) {
      allergyId
      allergen
      severity
      reaction
    }
    prescriptionsByPatient(patientId: $patientId) {
      prescriptionId
      dose
      frequency
      route
      isActive
      medication {
        name
        strength
      }
    }
  }
`;

export const START_ENCOUNTER = gql`
  mutation StartEncounter($input: CreateClinicalEncounterCommandInput!) {
    createClinicalEncounter(input: $input)
  }
`;

export const SAVE_NOTE = gql`
  mutation SaveNote($input: SaveClinicalNoteCommandInput!) {
    saveClinicalNote(input: $input)
  }
`;

export const GENERATE_AI_SOAP_DRAFT = gql`
  query GenerateAiSoapDraft($patientId: UUID!) {
    generateAiSoapDraft(patientId: $patientId) {
      subjective
      objective
      assessment
      plan
      suggestedIcdCodes
      suggestedIcdDescriptions
    }
  }
`;
