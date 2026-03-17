import { Navbar } from "@/landing/components/ui/navbar"
import { PricingSection } from "@/landing/components/sections/pricing-section"
import { FooterSection } from "@/landing/components/sections/footer-section"

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <Navbar />
      <PricingSection />
      <FooterSection />
    </main>
  )
}
