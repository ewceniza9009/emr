import { gql } from "@apollo/client";

export const GET_REASSIGNMENT_DATA = gql`
  query GetReassignmentData($id: UUID!) {
    appointment(id: $id) {
      appointmentId
      scheduledStart
      scheduledEnd
      modality
      status
      plannedAssessments
      practitioner {
        practitionerId
        fullName
        position
      }
      supportingClinicians {
        practitionerId
        fullName
        position
      }
      patient {
        patientId
        fullName
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
    availableProvidersForReassignment(appointmentId: $id) {
      practitionerId
      fullName
      avatarUrl
      travelTimeMinutes
      distanceInMiles
      isCareNavigator
      isSupportingClinician
      position
    }
  }
`;

export const BOOK_APPOINTMENT = gql`
  mutation BookAppointment($input: BookAppointmentInput!) {
    bookAppointment(input: $input) {
      appointmentId
      practitioner {
        practitionerId
        fullName
      }
      supportingClinicians {
        practitionerId
        fullName
      }
    }
  }
`;

export const DELETE_APPOINTMENT = gql`
  mutation DeleteAppointment($id: UUID!) {
    deleteAppointment(id: $id)
  }
`;

export const UPDATE_APPOINTMENT_STATUS = gql`
  mutation UpdateAppointmentStatus($input: UpdateAppointmentStatusInput!) {
    updateAppointmentStatus(input: $input) {
      appointmentId
      status
    }
  }
`;
