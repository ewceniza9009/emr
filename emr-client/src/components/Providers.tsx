"use client";

import { SessionProvider } from "next-auth/react";
import { ApolloProvider } from "@apollo/client";
import { client } from "@/lib/apollo-client";
import { ReactNode } from "react";
import ErrorBoundary from "./ErrorBoundary";
import { ToastProvider } from "./ToastProvider";
import SessionGuard from "./SessionGuard";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ApolloProvider client={client}>
        <ErrorBoundary>
          <ToastProvider>
            <SessionGuard>
              {children}
            </SessionGuard>
          </ToastProvider>
        </ErrorBoundary>
      </ApolloProvider>
    </SessionProvider>
  );
}
