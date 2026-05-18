import { gql } from "@apollo/client";

export const BOOK_APPOINTMENT = gql`
  mutation BookAppointment($input: BookAppointmentInput!) {
    bookAppointment(input: $input) {
      appointmentId
      scheduledStart
      scheduledEnd
      modality
      status
      travelTimeMinutes
      distanceInMiles
      plannedAssessments
    }
  }
`;

export const DELETE_APPOINTMENT = gql`
  mutation DeleteAppointment($id: UUID!) {
    deleteAppointment(id: $id)
  }
`;

export const CREATE_SCHEDULE_BLOCK = gql`
  mutation CreateScheduleBlock($input: CreateScheduleBlockInput!) {
    createScheduleBlock(input: $input) {
      blockId
      startTime
      endTime
      status
    }
  }
`;

export const GET_PATIENTS = gql`
  query GetPatients {
    patients {
      items {
        patientId
        firstName
        lastName
        mrn
        addresses {
          isPrimary
          address {
            street
            city
            state
            postalCode
          }
        }
      }
    }
  }
`;

export const GET_PRACTITIONERS = gql`
  query GetPractitioners {
    practitioners {
      practitionerId
      firstName
      lastName
      fullName
      position
      isCareNavigator
      isSupportingClinician
    }
  }
`;

export const GET_APPOINTMENT = gql`
  query GetAppointment($id: UUID!) {
    appointment(id: $id) {
      appointmentId
      patientId
      practitionerId
      facilityId
      practitioner { practitionerId firstName lastName position }
      supportingClinicians { practitionerId firstName lastName position }
      scheduledStart
      scheduledEnd
      modality
      status
      travelTimeMinutes
      distanceInMiles
      plannedAssessments
      patient {
        firstName
        lastName
        addresses {
          isPrimary
          address {
            street
            city
            state
            postalCode
          }
        }
      }
    }
  }
`;

export const GET_GEOSPATIAL_AVAILABILITY = gql`
  query GetGeospatialAvailability(
    $patientId: UUID!
    $targetStart: DateTime!
    $durationMinutes: Int!
    $modality: AppointmentModality!
    $appointmentId: UUID
  ) {
    availableProviders(
      patientId: $patientId
      targetStart: $targetStart
      durationMinutes: $durationMinutes
      modality: $modality
      appointmentId: $appointmentId
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

export const GET_FACILITIES = gql`
  query GetFacilities {
    facilities {
      facilityId
      name
      type
    }
  }
`;
