"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { ApolloProvider } from "@apollo/client";
import { client, setApolloAuthToken } from "@/lib/apollo-client";
import { ReactNode, useEffect } from "react";
import ErrorBoundary from "./ErrorBoundary";
import { ToastProvider } from "./ToastProvider";
import { SidebarProvider } from "@/lib/SidebarContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { SettingsProvider } from "@/lib/SettingsContext";
import SessionGuard from "./SessionGuard";
import { CommandModalProvider } from "./CommandModalProvider";

function ApolloAuthSync({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const token = status === "loading" ? undefined : ((session?.user as any)?.token ?? null);
  setApolloAuthToken(token);

  useEffect(() => {
    setApolloAuthToken(token);
  }, [token]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <ApolloAuthSync>
        <ApolloProvider client={client}>
          <ErrorBoundary>
            <SettingsProvider>
              <ThemeProvider>
                <SidebarProvider>
                  <ToastProvider>
                    <CommandModalProvider>
                      <SessionGuard>
                        {children}
                      </SessionGuard>
                    </CommandModalProvider>
                  </ToastProvider>
                </SidebarProvider>
              </ThemeProvider>
            </SettingsProvider>
          </ErrorBoundary>
        </ApolloProvider>
      </ApolloAuthSync>
    </SessionProvider>
  );
}

