"use client"

import { Button } from "./ui/button"
import { signInWithGoogle } from "@/lib/auth"

export function CtaSection() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-slate-950/10 to-transparent" />

      <div className="relative max-w-3xl mx-auto text-center">
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-4">Ship better support with TurboChat</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The best custom AI chatbot for SaaS support. Train AI chatbot on website docs, embed an AI
          support widget, and reduce support ticket volume with AI &mdash; all in one RAG chatbot platform.
          Start free, no credit card required.
        </p>
        <Button
          className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-6"
          onClick={() => signInWithGoogle()}
        >
          Start free trial
        </Button>
      </div>
    </section>
  )
}
