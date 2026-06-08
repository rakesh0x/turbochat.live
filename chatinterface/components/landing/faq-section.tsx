"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

const faqs = [
  {
    question: "What is TurboChat and how does it work?",
    answer:
      "TurboChat is an AI support assistant for SaaS teams. It learns from your website and docs, then answers customer questions with fast, source-grounded responses in your brand voice. It uses RAG (Retrieval-Augmented Generation) to pull answers directly from your content.",
  },
  {
    question: "What problem does TurboChat solve?",
    answer:
      "Support teams lose time repeating the same onboarding and troubleshooting answers. TurboChat handles repetitive questions automatically so your team can focus on complex, high-value conversations. It helps reduce customer support ticket volume with AI-powered automation.",
  },
  {
    question: "How quickly can I launch, and what are the plans?",
    answer:
      "Most teams launch in minutes: add your content, customize your assistant, and publish. Starter includes a free trial, then you can scale with Pro and Enterprise plans as usage grows.",
  },
  {
    question: "How to train an AI chatbot on website docs?",
    answer:
      "With TurboChat, training is straightforward. Add your website URL, help center links, or upload PDFs. The platform indexes your content and creates a RAG chatbot that retrieves answers from your specific documentation. You can refine responses, set guardrails, and test before going live. See our full guide at /blog.",
  },
  {
    question: "What is the best custom AI chatbot for SaaS support?",
    answer:
      "The best custom AI chatbot for SaaS support is one that trains on your actual product documentation, matches your brand voice, and integrates easily into your website. TurboChat lets you customize colors, logo, assistant name, and response tone — plus embed an AI support widget on your website with a single snippet.",
  },
  {
    question: "How to embed an AI support widget on a website?",
    answer:
      "TurboChat gives you an embed snippet after setup. Paste it into your site's HTML, and the widget appears as a chat bubble. It works with any website builder, CMS, or framework. The widget answers customer questions using your trained RAG chatbot automatically.",
  },
  {
    question: "What is a RAG chatbot platform for customer service?",
    answer:
      "RAG stands for Retrieval-Augmented Generation. A RAG chatbot platform for customer service retrieves relevant information from your knowledge base, docs, or PDFs and generates accurate, grounded answers. Unlike generic AI chatbots, RAG chatbots don't hallucinate — they cite your actual content. TurboChat is built on a RAG architecture.",
  },
  {
    question: "How to reduce customer support ticket volume with AI?",
    answer:
      "AI chatbots reduce ticket volume by handling common questions instantly — onboarding, pricing, troubleshooting, feature inquiries. TurboChat resolves up to 60% of repetitive tickets automatically, letting your team focus on escalations. Train it on your docs and it answers from your actual help content.",
  },
  {
    question: "Is TurboChat an affordable Intercom alternative for startups?",
    answer:
      "Yes. TurboChat starts free and scales predictably at $29/month for Pro. Unlike Intercom's per-seat pricing that grows with your team, TurboChat charges based on usage, making it a more affordable Intercom alternative for startups and growing SaaS teams.",
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }

  return (
    <section id="faq" className="py-24 px-6 bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
