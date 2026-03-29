"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

const faqs = [
  {
    question: "What is TurboChat and how does it work?",
    answer:
      "TurboChat is an AI support assistant for SaaS teams. It learns from your website and docs, then answers customer questions with fast, source-grounded responses in your brand voice.",
  },
  {
    question: "What problem does TurboChat solve?",
    answer:
      "Support teams lose time repeating the same onboarding and troubleshooting answers. TurboChat handles repetitive questions automatically so your team can focus on complex, high-value conversations.",
  },
  {
    question: "How quickly can I launch, and what are the plans?",
    answer:
      "Most teams launch in minutes: add your content, customize your assistant, and publish. Starter includes a free trial, then you can scale with Pro and Enterprise plans as usage grows.",
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl">
              Frequently asked
              <br />
              questions
            </h2>
          </div>
          <div className="space-y-0">
            {faqs.map((faq, index) => (
              <div key={index} className="border-t">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between py-5 text-left"
                >
                  <span className="text-sm pr-4">{faq.question}</span>
                  <Plus
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${openIndex === index ? "rotate-45" : ""}`}
                  />
                </button>
                {openIndex === index && <div className="pb-5 text-sm text-muted-foreground">{faq.answer}</div>}
              </div>
            ))}
            <div className="border-t" />
          </div>
        </div>
      </div>
    </section>
  )
}
