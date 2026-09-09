'use client';

import { createContext, useContext } from 'react';

/* ==========================================================================
   Asking for credits, from anywhere
   --------------------------------------------------------------------------
   Every "top up" in the console — the rail footer, the low-credits banner,
   the plate on Plan & usage — has to open the same thing, and none of them
   may navigate. Navigating was the whole defect: someone halfway through
   adding a chatbot got dropped on the marketing pricing page, which answers
   "which plan suits my company" when the question they actually had was "how
   do I unblock this, right now". Different question, so a different screen.

   The ask is therefore a dialog the shell owns, and this file is only the wire
   that reaches it. It is deliberately separate from topup.tsx: that module
   imports the credit meter from upsell.tsx, and upsell.tsx imports this hook,
   so keeping the context on its own is what stops the two becoming a cycle.

   Outside a provider the hook falls back to /pricing instead of throwing. The
   marketing page is still the right surface for a visitor who is not inside
   the console — it just must never be where a signed-in customer lands.
   ========================================================================== */

export type TopUpContextValue = {
  /** `reason` reaches the checkout metadata, so we can tell which ask worked. */
  open: (reason?: string) => void;
};

const OUTSIDE_THE_CONSOLE: TopUpContextValue = {
  open: () => {
    if (typeof window !== 'undefined') window.location.href = '/pricing';
  },
};

export const TopUpContext = createContext<TopUpContextValue>(OUTSIDE_THE_CONSOLE);

export function useTopUp(): TopUpContextValue {
  return useContext(TopUpContext);
}
