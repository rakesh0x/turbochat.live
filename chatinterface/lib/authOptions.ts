import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

/* NextAuth configuration lives here, not in the route file: a Next route
   segment may only export the request handlers and a fixed set of config
   keys, so exporting `authOptions` from `route.ts` fails the route type
   check — and `app/page.tsx` needs these options for getServerSession. */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }: any) {
      if (account && user) {
        token.sub = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.email = token.email;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
