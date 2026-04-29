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
          Replace repetitive support replies with a trained assistant that answers instantly using your own website and
          documentation.
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
