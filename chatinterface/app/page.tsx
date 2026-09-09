import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { SmoothScroll } from "@/components/landing/v2/lenis"
import { LandingNav } from "@/components/landing/v2/landing-nav"
import { Hero } from "@/components/landing/v2/hero"
import { LogoMarquee } from "@/components/landing/v2/logo-marquee"
import { Stats } from "@/components/landing/v2/stats"
import { Features } from "@/components/landing/v2/features"
import { Workflow } from "@/components/landing/v2/workflow"
import { Insights } from "@/components/landing/v2/insights"
import { Pricing } from "@/components/landing/v2/pricing"
import { Faq } from "@/components/landing/v2/faq"
import { FinalCta } from "@/components/landing/v2/final-cta"
import { Footer } from "@/components/landing/v2/footer"

export const dynamic = "force-dynamic"

export default async function Home() {
  let session = null
  try {
    session = await getServerSession(authOptions)
  } catch (error) {
    console.error("[Home] session check failed:", error)
  }

  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SmoothScroll>
        <LandingNav />
        <Hero />
        <LogoMarquee />
        <Stats />
        <Workflow />
        <Features />
        <Insights />
        <Pricing />
        <Faq />
        <FinalCta />
        <Footer />
      </SmoothScroll>
    </main>
  )
}
