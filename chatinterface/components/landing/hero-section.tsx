"use client"

import Image from "next/image"
import { Button } from "./ui/button"
import { signInWithGoogle } from "@/lib/auth"

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-white">
      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight text-balance">
            Turn your website into a
            <br />
            support copilot with TurboChat
          </h1>
          <p className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto">
            Support teams repeat the same answers every day. TurboChat learns from your site and docs, then replies
            instantly with accurate, source-grounded help around the clock.
          </p>
          <Button
            className="mt-8 rounded-full bg-foreground text-background hover:bg-foreground/90 px-6"
            onClick={() => signInWithGoogle()}
          >
            Start free trial
          </Button>
        </div>

        <div className="mx-auto mt-12 w-full max-w-4xl">
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
