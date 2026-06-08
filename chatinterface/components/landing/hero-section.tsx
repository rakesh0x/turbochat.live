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
            Train an AI chatbot on your
            <br />
            website docs in minutes
          </h1>
          <p className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto">
            TurboChat is a <strong>RAG chatbot platform for customer service</strong> that learns from your help
            center, PDFs, and product docs. Embed an AI support widget on your website and reduce support
            ticket volume with AI &mdash; the best custom AI chatbot for <strong>SaaS support</strong> and an
            affordable <strong>Intercom alternative</strong> for startups.
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
