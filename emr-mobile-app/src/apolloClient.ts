import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:34732/graphql',
});

const authLink = setContext((_, { headers }) => {
  // Mobile app uses JWT token stored in localStorage (or Capacitor Preferences)
  const token = localStorage.getItem('halkyone-mobile-token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
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
