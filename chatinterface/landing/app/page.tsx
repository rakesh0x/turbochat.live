import { Navbar } from "@/components/ui/navbar"
import { HeroSection } from "@/components/sections/hero-section"
import { ImpactSection } from "@/components/sections/impact-section"
import { FeaturesSection } from "@/components/sections/feature-section"
import { PricingSection } from "@/components/sections/pricing-section"
import { CtaSection } from "@/components/sections/cta-section"
import { FooterSection } from "@/components/sections/footer-section"
import { TestimonialsSection } from "@/components/sections/testinomials-section"
export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#090c12] text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-[radial-gradient(1200px_420px_at_50%_-10%,rgba(56,189,248,0.16),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-40 h-[420px] bg-[radial-gradient(800px_320px_at_20%_10%,rgba(16,185,129,0.10),transparent_60%)]" />
      <Navbar />
      <HeroSection />
      <ImpactSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
      <FooterSection />
    </main>
  )
}
