"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import CreateChatbotPage from "@/components/createChatbot";
import { Toaster } from "@/components/ui/sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [userData, setUserData] = useState<any>(null);
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    if (!session) return;

    const checkExistingChatbots = async () => {
      try {
        const res = await fetch("/api/chatbots");
        if (res.ok) {
          const chatbots = await res.json();
          if (Array.isArray(chatbots) && chatbots.length > 0) {
            router.push("/dashboard");
            return;
          }
        }
      } catch {
        // Silently fail — if we can't verify, let the user proceed
      }
      setRedirecting(false);
    };

    checkExistingChatbots();
  }, [session, router]);

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(setUserData);
  }, []);

  const remainingCredits = userData?.credits ?? 0;
  const remainingFreeTrials = userData?.freeTrialRemaining ?? 0;
  const canCreateChatbot = true;

  if (!session || redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f3]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f5f3]">
      <Toaster />

      {/* Decorative background blobs */}
      <div className="pointer-events-none fixed -left-24 top-24 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="pointer-events-none fixed -right-16 bottom-10 h-80 w-80 rounded-full bg-cyan-300/15 blur-3xl" />

      {/* Main content */}
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12 md:py-20">
        {/* Welcome header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-50/80 px-4 py-1.5 text-xs font-medium text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Welcome to Turbochat
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Let&apos;s set up your first chatbot
          </h1>
          <p className="mt-2 text-lg text-slate-500">
            In just 3 steps, we&apos;ll train an AI assistant for your website.
          </p>
        </div>

        <CreateChatbotPage
          onComplete={(createdBot: any) => {
            if (createdBot) {
              router.push("/dashboard");
              toast.success("Your chatbot is ready! Head to the dashboard to deploy it.");
            }
          }}
          canCreateChatbot={canCreateChatbot}
          remainingCredits={remainingCredits}
          remainingFreeTrials={remainingFreeTrials}
          onBlocked={() => router.push("/pricing")}
          successButtonText="Go to Dashboard"
        />
      </main>
    </div>
  );
}
