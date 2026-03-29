"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === "/") {
        router.replace("/dashboard");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  return (
    <div className="dark min-h-screen bg-[#090c12] text-slate-100">
      {children}
      {modal}
    </div>
  );
}
