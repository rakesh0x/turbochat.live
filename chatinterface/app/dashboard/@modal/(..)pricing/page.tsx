"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { PricingSection } from "@/landing/components/sections/pricing-section";

export default function DashboardPricingModalPage() {
  const router = useRouter();

  const closeModal = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={closeModal}
      role="presentation"
    >
      <div
        className="relative h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeModal}
          className="sticky right-4 top-4 z-10 ml-auto mr-4 mt-4 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-zinc-100 transition hover:bg-zinc-800"
          aria-label="Close pricing"
        >
          <X className="h-5 w-5" />
        </button>

        <main className="min-h-full bg-zinc-950 px-2 pb-8 sm:px-4">
          <PricingSection />
        </main>
      </div>
    </div>
  );
}
