"use client"

import { Button } from "./ui/button"
import { signInWithGoogle } from "@/lib/auth"

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-white">
      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="text-center mx-auto">
          <h1 className="mx-auto max-w-5xl font-serif text-4xl md:text-5xl lg:text-[72px] leading-[1.05] tracking-[-0.04em]">
            Your customers have questions.
            <br />
            Your website has the answers.
          </h1>

          <p className="mt-8 max-w-2xl mx-auto text-lg text-muted-foreground leading-8">
            TurboChat learns from your website and docs, then answers customer
            questions instantly.
          </p>

          <Button
            className="mt-10 rounded-full bg-foreground text-background hover:bg-foreground/90 px-6"
            onClick={() => signInWithGoogle()}
          >
            Start free trial
          </Button>
        </div>

        <div className="mx-auto mt-16 w-full max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
            <video
              className="w-full h-auto object-cover"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src="/turbochatdemo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </section>
  )
}
