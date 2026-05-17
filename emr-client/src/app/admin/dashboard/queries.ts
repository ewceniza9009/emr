import { gql } from "@apollo/client";

export const GET_SETUP_DATA = gql`
  query GetSetupData {
    practitioners {
      practitionerId
      firstName
      lastName
      position
      isActive
      prcLicenseNumber
      npiNumber
      isCareNavigator
      isSupportingClinician
      userId
      addresses {
        entityAddressId
        address {
          street
          city
          state
          postalCode
          country
        }
      }
      licensures {
        licensureId
        licenseNumber
        state
        expiryDate
      }
      serviceAreas {
        serviceAreaId
        zipCode
        county
      }
    }
    facilities {
      facilityId
      name
      type
      facilityAddress {
        street
        city
        state
        postalCode
        country
      }
      contactPerson
      contactPhone
      contactEmail
    }
    healthPlans {
      healthPlanId
      name
      code
      isActive
    }
    medications {
      medicationId
      name
      strength
      defaultRoute
    }
    smartPhrases {
      phraseId
      shortcut
      templateText
      label
      isActive
    }
    questionnaires {
      questionnaireId
      name
      assessmentType
      schemaJson
      questions {
        questionId
      }
    }
    equipment {
      equipmentId
      serialNumber
      modelName
      type
      status
    }
    outreachScripts {
      outreachScriptId
      locationName
      scriptTitle
      content
    }
    integrationProfiles {
      integrationProfileId
      partner
      apiKey
      isActive
    }
  }
`;

export const DELETE_MUTATIONS = {
  practitioners: gql`
    mutation DeletePractitioner($id: Guid!) {
      deletePractitioner(id: $id)
    }
  `,
  facilities: gql`
    mutation DeleteFacility($id: Guid!) {
      deleteFacility(id: $id)
    }
  `,
  healthPlans: gql`
    mutation DeleteHealthPlan($id: Guid!) {
      deleteHealthPlan(id: $id)
    }
  `,
  medications: gql`
    mutation DeleteMedication($id: Guid!) {
      deleteMedication(id: $id)
    }
  `,
  smartPhrases: gql`
    mutation DeleteSmartPhrase($id: Guid!) {
      deleteSmartPhrase(id: $id)
    }
  `,
  questionnaires: gql`
    mutation DeleteQuestionnaire($id: Guid!) {
      deleteQuestionnaire(id: $id)
    }
  `,
  equipment: gql`
    mutation DeleteEquipment($id: Guid!) {
      deleteEquipment(id: $id)
    }
  `,
  outreachScripts: gql`
    mutation DeleteOutreachScript($id: Guid!) {
      deleteOutreachScript(id: $id)
    }
  `,
  integrationProfiles: gql`
    mutation DeleteIntegrationProfile($id: Guid!) {
      deleteIntegrationProfile(id: $id)
    }
  `,
};

export const INVITE_PRACTITIONER = gql`
  mutation InvitePractitioner($practitionerId: Guid!, $email: String!) {
    invitePractitioner(practitionerId: $practitionerId, email: $email)
  }
`;
