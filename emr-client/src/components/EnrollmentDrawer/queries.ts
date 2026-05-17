import { gql } from "@apollo/client";

export const GET_LEAD_DETAILS = gql`
  query GetLeadDetails($id: UUID!) {
    outreachById(outreachId: $id) {
      patientOutreachId
      firstName
      lastName
      primaryPhone
      primaryEmail
      referralSource
      techAccess
      barriersToCare
      communicationStatus
      status
      nextFollowUpDate
      isDoNotCall
      isOptedOut
      mailingAddress {
        street
        city
        state
        postalCode
      }
      dateOfBirth
      biologicalSex
      genderIdentity
      language
      civilStatus
      otherContacts {
        outreachContactId
        firstName
        lastName
        relationship
        phoneNumber
        isPrimaryContact
      }
      activities {
        outreachActivityId
        activityDate
        outcome
        method
        reason
        notes
      }
    }
  }
`;

export const GET_ENROLLMENT_DATA = gql`
  query GetEnrollmentData {
    healthPlans {
      healthPlanId
      name
    }
    outreachScripts {
      outreachScriptId
      scriptTitle
      content
    }
    practitioners {
      practitionerId
      fullName
      firstName
      lastName
      position
      isCareNavigator
      isSupportingClinician
    }
    facilities {
      facilityId
      name
      type
    }
  }
`;

export const LOG_OUTREACH_ACTIVITY = gql`
  mutation LogActivity($input: LogOutreachActivityCommandInput!) {
    logOutreachActivity(input: $input)
  }
`;

export const ADD_OUTREACH_CONTACT = gql`
  mutation AddContact($input: AddOutreachContactCommandInput!) {
    addOutreachContact(input: $input)
  }
`;

export const REMOVE_OUTREACH_CONTACT = gql`
  mutation RemoveContact($input: RemoveOutreachContactCommandInput!) {
    removeOutreachContact(input: $input)
  }
`;

export const UPDATE_OUTREACH_CONTACT = gql`
  mutation UpdateContact($input: UpdateOutreachContactCommandInput!) {
    updateOutreachContact(input: $input)
  }
`;

export const UPDATE_OUTREACH_LEAD = gql`
  mutation UpdateLead($input: UpdateOutreachLeadCommandInput!) {
    updateOutreachLead(input: $input)
  }
`;

export const SEARCH_DIAGNOSIS_LIBRARY = gql`
  query SearchDiagnosisLibrary($term: String!) {
    searchDiagnosisLibrary(term: $term) {
      diagnosisId: icd10Code
      icd10Code
      description
    }
  }
`;

export const UNENROLL_PATIENT = gql`
  mutation UnenrollPatient($input: UnenrollPatientCommandInput!) {
    unenrollPatient(input: $input)
  }
`;

export const SEARCH_PATIENTS = gql`
  query SearchPatients($search: String) {
    patients(search: $search) {
      items {
        patientId
        firstName
        lastName
        dob
        mrn
      }
    }
  }
`;

export const FINALIZE_ENROLLMENT = gql`
  mutation FinalizeEnrollment($input: FinalizeEnrollmentCommandInput!) {
    finalizeEnrollment(input: $input)
  }
`;

export const GET_GEOSPATIAL_AVAILABILITY = gql`
  query GetGeospatialAvailability(
    $patientId: UUID!
    $targetStart: DateTime!
    $durationMinutes: Int!
    $modality: AppointmentModality!
  ) {
    availableProviders(
      patientId: $patientId
      targetStart: $targetStart
      durationMinutes: $durationMinutes
      modality: $modality
    ) {
      practitionerId
      fullName
      role
      distanceInMiles
      travelTimeInMinutes
      shiftStart
      shiftEnd
    }
  }
`;
