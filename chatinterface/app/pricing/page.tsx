import { Navbar } from "@/landing/components/ui/navbar"
import { PricingSection } from "@/landing/components/sections/pricing-section"
import { FooterSection } from "@/landing/components/sections/footer-section"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { GET } from "@/app/api/auth/[...nextauth]/route"

export const dynamic = "force-dynamic"

export default async function PricingPage() {
  const session = await getServerSession(GET as any)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      <PricingSection />
    </main>
  )
}