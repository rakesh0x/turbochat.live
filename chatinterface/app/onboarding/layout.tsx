import type { Metadata } from 'next';

/* First run is behind a login and is not a page anyone should land on from a
   search result — the flow assumes a session and a fresh account. */
export const metadata: Metadata = {
  title: 'Set up your chatbot',
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
