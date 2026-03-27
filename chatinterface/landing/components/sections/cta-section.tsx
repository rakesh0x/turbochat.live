"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { LiquidCtaButton } from "../buttons/liquid-cta-button"
import { signInWithGoogle } from "../../lib/auth"
import { useRouter } from "next/navigation"

export function CtaSection() {
  const router = useRouter()
  return (
    <section className="px-6 py-24">
      <div className="max-w-4xl mx-auto text-center rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-950 p-10 md:p-14 shadow-[0_20px_80px_rgba(0,0,0,0.4)]">
        <h2 className="font-display text-4xl md:text-5xl font-bold text-slate-100 mb-6">Ready to launch your AI support layer?</h2>
        <p className="text-lg text-slate-400 mb-10 text-balance max-w-2xl mx-auto">
          Join thousands of teams already building better products with our platform. Start your free trial today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <LiquidCtaButton
            onClick={() => signInWithGoogle(router)}
            >Start Free Trial</LiquidCtaButton>
          <Link
            href="#"
            className="group flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-400 hover:text-slate-100 transition-colors"
          >
            <span>Schedule a demo</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </div>
    </section>
  )
}
