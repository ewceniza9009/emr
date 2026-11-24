import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const resolveGraphqlUri = (): string => {
  if (typeof window !== 'undefined') {
    const activeApiUrl = localStorage.getItem('halkyone-mobile-api-url');
    if (activeApiUrl) {
      return `${activeApiUrl.replace(/\/+$/, '')}/graphql`;
    }
  }
  return import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:34732/graphql';
};

const httpLink = createHttpLink({
  uri: () => resolveGraphqlUri(),
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('halkyone-mobile-token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Patient: {
        keyFields: ["patientId"],
      }
    }
  })
});
