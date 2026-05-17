import { gql } from "@apollo/client";

export const GET_SCHEDULE_DATA = gql`
  query GetScheduleData($startDate: DateTime!, $endDate: DateTime!) {
    appointments(startDate: $startDate, endDate: $endDate) {
      items {
        appointmentId
        scheduledStart
        scheduledEnd
        modality
        status
        travelTimeMinutes
        distanceInMiles
        practitionerId
        plannedAssessments
        practitioner {
          practitionerId
          firstName
          lastName
          position
        }
        supportingClinicians {
          practitionerId
          firstName
          lastName
          position
        }
        encounters {
          practitioner {
            practitionerId
            firstName
            lastName
            position
          }
        }
        patient {
          firstName
          lastName
          mrn
          addresses {
            isPrimary
            address {
              street
            }
          }
        }
      }
    }
    scheduleBlocks(startDate: $startDate, endDate: $endDate) {
      blockId
      startTime
      endTime
      status
      practitionerId
      practitioner {
        practitionerId
        firstName
        lastName
        position
      }
    }
    practitioners {
      practitionerId
      firstName
      lastName
      position
    }
  }
`;

export const RESCHEDULE_APPOINTMENT = gql`
  mutation RescheduleAppointment($input: RescheduleAppointmentInput!) {
    rescheduleAppointment(input: $input) {
      appointmentId
      scheduledStart
      scheduledEnd
      travelTimeMinutes
      distanceInMiles
    }
  }
`;

export const UPDATE_SCHEDULE_BLOCK = gql`
  mutation UpdateScheduleBlock($input: UpdateScheduleBlockInput!) {
    updateScheduleBlock(input: $input) {
      blockId
      startTime
      endTime
    }
  }
`;

export const DELETE_SCHEDULE_BLOCK = gql`
  mutation DeleteScheduleBlock($id: UUID!) {
    deleteScheduleBlock(id: $id)
  }
`;
