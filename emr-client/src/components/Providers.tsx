"use client";

import { SessionProvider } from "next-auth/react";
import { ApolloProvider } from "@apollo/client";
import { client } from "@/lib/apollo-client";
import { ReactNode } from "react";
import ErrorBoundary from "./ErrorBoundary";
import { ToastProvider } from "./ToastProvider";
import { SidebarProvider } from "@/lib/SidebarContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { SettingsProvider } from "@/lib/SettingsContext";
import SessionGuard from "./SessionGuard";
import { CommandModalProvider } from "./CommandModalProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
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
    </SessionProvider>
  );
}

