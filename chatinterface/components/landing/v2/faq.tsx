"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Reveal } from "./reveal"

const faqs = [
  {
    q: "How does TurboChat train on my content?",
    a: "Paste your website URL, upload PDFs, or sync a help center and we crawl, chunk, and index it into a searchable knowledge base. Your agent answers using retrieval-augmented generation (RAG), so every reply is grounded in your actual content — never made up.",
  },
  {
    q: "How long does it take to go live?",
    a: "Most teams go from signup to a live widget in about five minutes. Add your content, customize the look and tone, copy the one-line embed snippet, and you're done. No engineering work required.",
  },
  {
    q: "Can it match my brand?",
    a: "Yes. Set your logo, colors, assistant name, and response tone in the design panel, and the widget inherits it all automatically. Your customers see a support experience that looks native to your product.",
  },
  {
    q: "What happens when a customer needs a human?",
    a: "The agent hands off the full conversation transcript — with context — to your team over Slack or email in one click. Nothing gets lost, and your customers never have to repeat themselves.",
  },
  {
    q: "Will it hallucinate answers?",
    a: "TurboChat is source-grounded. It only answers from the content you provide and cites its sources inline. If it doesn't know something, it says so and escalates rather than guessing.",
  },
  {
    q: "What's the difference between TurboChat and Intercom?",
    a: "TurboChat charges by usage, not per seat, so it's far more affordable for startups. It focuses on one thing — answering customers from your own docs — and does it without a sales team in the loop.",
  },
]

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
                FAQ
              </p>
              <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
                Questions, answered.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Can&apos;t find what you&apos;re looking for?{" "}
                <a href="mailto:hello@turbochat.live" className="font-medium text-foreground underline underline-offset-4 hover:text-violet-600">
                  Email us
                </a>{" "}
                — a human replies within a day.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-b border-border first:border-t">
                  <AccordionTrigger className="py-5 text-base font-medium hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
