import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" }
          });

          const data = await res.json();
          if (res.ok && data) {
            return {
              ...data.user,
              token: data.token
            };
          }
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.id = u.id;
        token.role = u.roles?.[0] || u.role;
        token.roles = u.roles;
        token.permissions = u.permissions;
        token.token = u.token;
        token.practitionerId = u.practitionerId;
        token.tenantId = u.tenantId;
        token.emergencyAccessActive = u.emergencyAccessActive;
        token.name = u.name || (u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : null);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.roles = token.roles as string[];
        session.user.permissions = token.permissions as string[];
        session.user.token = token.token as string;
        session.user.practitionerId = token.practitionerId as string;
        session.user.tenantId = token.tenantId as string;
        session.user.emergencyAccessActive = token.emergencyAccessActive as boolean;
        session.user.name = token.name as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
};

