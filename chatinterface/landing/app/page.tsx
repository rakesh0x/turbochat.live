import { Navbar } from "@/landing/components/ui/navbar"
import { HeroSection } from "@/landing/components/sections/hero-section"
import { ImpactSection } from "@/landing/components/sections/impact-section"
import { FeaturesSection } from "@/landing/components/sections/feature-section"
import { TestimonialsSection } from "@/landing/components/sections/testinomials-section"
import { PricingSection } from "@/landing/components/sections/pricing-section"
import { CtaSection } from "@/landing/components/sections/cta-section"
import { FooterSection } from "@/landing/components/sections/footer-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950">
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
