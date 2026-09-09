"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import posthog from "posthog-js";
import { ThemeProvider } from "@/components/theme-provider";

function PostHogIdentifier() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      posthog.identify(session.user.email, {
        email: session.user.email,
        name: session.user.name ?? undefined,
      });
    }
  }, [status, session?.user?.email]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/* Dark mode is an opt-in the reader makes in the console, not a guess
          we make from their OS. The marketing site was composed in light and
          should stay there until someone asks otherwise. */}
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <PostHogIdentifier />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}