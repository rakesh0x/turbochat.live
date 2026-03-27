import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "https://turbochat.live";

export const metadata: Metadata = {
  title: "Turbochat AI Official Site | AI Chatbot for Websites",
  description:
    "Turbochat AI is an AI chatbot platform for websites. Train on your docs and pages, then launch a source-grounded assistant for support and sales.",
  alternates: {
    canonical: "/turbochat",
  },
  openGraph: {
    type: "website",
    url: "/turbochat",
    title: "Turbochat AI Official Site | AI Chatbot for Websites",
    description:
      "Launch a Turbochat AI chatbot for your website in minutes with grounded answers from your own content.",
    siteName: "Turbochat AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Turbochat AI Official Site | AI Chatbot for Websites",
    description: "Deploy a website AI chatbot using Turbochat AI.",
  },
};

const faqItems = [
  {
    question: "What is Turbochat AI?",
    answer:
      "Turbochat AI is a website chatbot platform that learns from your pages and documentation to provide source-grounded answers.",
  },
  {
    question: "How is Turbochat different from a generic chatbot?",
    answer:
      "Turbochat AI is trained on your own website content so responses stay relevant to your product, policies, and docs.",
  },
  {
    question: "Can I add Turbochat to any website?",
    answer:
      "Yes. Turbochat AI is built to work with most websites and web stacks using a lightweight embed workflow.",
  },
  {
    question: "Is Turbochat AI good for customer support?",
    answer:
      "Yes. Teams use Turbochat AI to answer repetitive support questions, reduce response times, and improve conversion on key pages.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Turbochat AI",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: `${siteUrl}/turbochat`,
  description:
    "Turbochat AI helps businesses launch AI chatbots trained on website content.",
  brand: {
    "@type": "Brand",
    name: "Turbochat AI",
  },
};

export default function TurbochatSeoPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 pb-20 pt-28 text-zinc-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />

      <section className="mx-auto max-w-4xl rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 md:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Official Turbochat Page</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">Turbochat AI</h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-300 md:text-lg">
          Turbochat AI is a platform for building an AI chatbot for your website. Train your assistant on product pages,
          docs, FAQs, and help-center content, then deploy a source-grounded chat experience for support and growth.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
          >
            Start with Turbochat AI
          </Link>
          <Link
            href="/#pricing"
            className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500"
          >
            View Pricing
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-4xl rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 md:p-10">
        <h2 className="text-2xl font-semibold tracking-tight">Why people search for Turbochat</h2>
        <ul className="mt-5 space-y-3 text-zinc-300">
          <li>Fast setup from a single URL.</li>
          <li>Grounded answers using your own website content.</li>
          <li>Built for SaaS, docs sites, and support teams.</li>
          <li>Simple deployment and easy iteration.</li>
        </ul>
      </section>

      <section className="mx-auto mt-10 max-w-4xl rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 md:p-10">
        <h2 className="text-2xl font-semibold tracking-tight">Turbochat AI FAQ</h2>
        <div className="mt-6 space-y-5">
          {faqItems.map((item) => (
            <article key={item.question}>
              <h3 className="text-lg font-semibold text-zinc-100">{item.question}</h3>
              <p className="mt-2 text-zinc-300">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}