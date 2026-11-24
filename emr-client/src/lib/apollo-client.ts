import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { setContext } from "@apollo/client/link/context";
import { getSession } from "next-auth/react";

let cachedAuthToken: string | null | undefined = undefined;

export function setApolloAuthToken(token: string | null | undefined) {
  cachedAuthToken = token;
}

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
});

const authLink = setContext(async (_, { headers }) => {
  let token = cachedAuthToken;
  if (token === undefined && typeof window !== "undefined") {
    const session = await getSession();
    token = (session?.user as any)?.token ?? null;
    cachedAuthToken = token;
  }

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

const splitLink = authLink.concat(httpLink);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Patient: {
        keyFields: ["patientId"],
      },
      PatientOutreach: {
        keyFields: ["patientOutreachId"],
      },
      Practitioner: {
        keyFields: ["practitionerId"],
      },
      Appointment: {
        keyFields: ["appointmentId"],
      },
      ClinicalEncounter: {
        keyFields: ["encounterId"],
      },
      CareNavigationCase: {
        keyFields: ["caseId"],
      },
      HealthPlan: {
        keyFields: ["healthPlanId"],
      },
      Facility: {
        keyFields: ["facilityId"],
      },
      OutreachActivity: {
        keyFields: ["outreachActivityId"],
      },
      OutreachContact: {
        keyFields: ["outreachContactId"],
      },
      PatientDocument: {
        keyFields: ["patientDocumentId"],
      },
      EsasAssessment: {
        keyFields: ["assessmentId"],
      },
      Allergy: {
        keyFields: ["allergyId"],
      },
      Diagnosis: {
        keyFields: ["diagnosisId"],
      },
      VitalSign: {
        keyFields: ["vitalId"],
      },
      ClinicalNote: {
        keyFields: ["noteId"],
      },
      AssessmentResponse: {
        keyFields: ["assessmentResponseId"],
      },
      AssessmentResponseDto: {
        keyFields: ["assessmentResponseId"],
      },
      SpiritualAssessment: {
        keyFields: ["spiritualAssessmentId"],
      },
      AdvanceDirective: {
        keyFields: ["advanceDirectiveId"],
      },
      Questionnaire: {
        keyFields: ["questionnaireId"],
      },
      Question: {
        keyFields: ["questionId"],
      },
      CareThread: {
        keyFields: ["careThreadId"],
      },
      ChatMessage: {
        keyFields: ["chatMessageId"],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

