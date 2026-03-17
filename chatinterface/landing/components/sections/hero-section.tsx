"use client"

import Link from "next/link"
import { LiquidCtaButton } from "../buttons/liquid-cta-button"
import { Sparkles, ExternalLink } from "lucide-react"
import { Input } from "../ui/input"

export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center px-6 pt-32 pb-20 relative">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 text-center mt-15 max-w-4xl mx-auto">
        {/* Badge - customize your announcement */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/70 border border-slate-700/60 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span className="text-xs text-slate-300">Production-ready AI agents from your own content</span>
        </div>

        {/* Headline - customize your value proposition */}
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-4">
          <span className="text-slate-100 block">Turn your website into</span>
          <span className="bg-gradient-to-r from-cyan-200 via-slate-100 to-emerald-200 bg-clip-text text-transparent">
            a premium AI assistant.
          </span>
        </h1>

        {/* Subheadline - describe your product */}
        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          Paste your site URL, let Turbochat learn your product and docs, and ship an on-brand support assistant in minutes.
        </p>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {[
            "No-code setup",
            "Instant embed",
            "Source-grounded answers",
            "Works with every stack",
          ].map((item) => (
            <span key={item} className="rounded-full border border-slate-700/60 bg-slate-900/40 px-3 py-1 text-xs text-slate-300">
              {item}
            </span>
          ))}
        </div>

        {/* CTAs - URL Input Group */}
        <div className="flex flex-col items-center gap-4 max-w-xl mx-auto">
          <div className="w-full flex flex-col sm:flex-row items-center gap-3 p-2 rounded-2xl bg-slate-900/50 border border-slate-700/60 focus-within:border-cyan-400/40 transition-all">
            <div className="flex-1 w-full px-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <Input
                placeholder="https://yourwebsite.com"
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <Link href="#pricing" className="w-full sm:w-auto">
              <LiquidCtaButton className="w-full sm:w-auto h-12 px-8">Create Chatbot</LiquidCtaButton>
            </Link>
          </div>
          <p className="text-xs text-slate-500">No credit card required. Go from crawl to live widget in minutes.</p>
        </div>

        {/* Hero Video - Premium Showcase */}
        <div className="mt-20 relative group">
          {/* Decorative glow behind the video */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-900/30 via-slate-700/30 to-emerald-900/30 rounded-2xl blur-2xl opacity-30 group-hover:opacity-40 transition duration-1000" />

          <div className="relative rounded-2xl border border-slate-700/50 bg-slate-900/50 overflow-hidden shadow-2xl backdrop-blur-sm">
            <video
              className="w-full h-auto max-h-[600px] object-cover"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src="/hero-video-new.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Overlay gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <img
                src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200"
                alt="User avatar"
                className="w-10 h-10 rounded-full border-2 border-zinc-950 hover:-translate-y-1 transition object-cover z-[1]"
              />
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"
                alt="User avatar"
                className="w-10 h-10 rounded-full border-2 border-zinc-950 hover:-translate-y-1 transition object-cover z-[2]"
              />
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&h=200&auto=format&fit=crop"
                alt="User avatar"
                className="w-10 h-10 rounded-full border-2 border-zinc-950 hover:-translate-y-1 transition object-cover z-[3]"
              />
              <img
                src="https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?q=80&w=200"
                alt="User avatar"
                className="w-10 h-10 rounded-full border-2 border-zinc-950 hover:-translate-y-1 transition object-cover z-[4]"
              />
              <img
                src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=200"
                alt="User avatar"
                className="w-10 h-10 rounded-full border-2 border-zinc-950 hover:-translate-y-1 transition object-cover z-[5]"
              />
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="#FACC15"
                    stroke="#FACC15"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
                  </svg>
                ))}
                <span className="text-slate-300 font-medium ml-1 text-sm">5.0</span>
              </div>
              <p className="text-sm text-slate-500">
                Trusted by <span className="text-slate-200 font-medium">10,000+</span> teams and developers
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
