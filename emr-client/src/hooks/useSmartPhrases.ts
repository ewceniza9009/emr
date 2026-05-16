import { useQuery, gql } from "@apollo/client";

const GET_SMART_PHRASES = gql`
  query GetSmartPhrases {
    smartPhrases {
      shortcut
      label
      templateText
    }
  }
`;

export function useSmartPhrases() {
  const { data, loading, error } = useQuery(GET_SMART_PHRASES);
  
  return {
    smartPhrases: data?.smartPhrases || [],
    loading,
    error
  };
}
