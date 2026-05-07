import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from "@apollo/client/link/context";
import { getSession } from "next-auth/react";

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
});

const authLink = setContext(async (_, { headers }) => {
  const session = await getSession();
  const token = (session?.user as any)?.token;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const wsLink = typeof window !== 'undefined'
  ? new GraphQLWsLink(
      createClient({
        url: process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'ws://localhost:34731/graphql',
        connectionParams: async () => {
          const session = await getSession();
          const token = (session?.user as any)?.token;
          return {
            Authorization: token ? `Bearer ${token}` : "",
          };
        },
      })
    )
  : null;

const splitLink = authLink.concat(httpLink);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

