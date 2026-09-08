import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What TurboChat collects, what it does with it, and who else sees it. A working draft, pending review.",
  alternates: { canonical: "/privacy" },
  // Draft, so it stays out of search for now. Remove once the final text is in place.
  robots: { index: false, follow: true },
}

type Section = {
  heading: string
  body: string[]
  /** Facts or wording that a person has to supply before this ships. */
  todo?: string
}

const sections: Section[] = [
  {
    heading: "What we collect",
    body: [
      "When you sign in with Google we receive your name, email address and profile picture. When you train an assistant we store the pages, files and settings you add, and the questions your customers ask it.",
      "We do not ask for anything else, and there is no reason to send us sensitive personal data as training content.",
    ],
  },
  {
    heading: "What we do with it",
    body: [
      "We use it to run the service: to answer your customers from your content, to show you what was asked, and to contact you about your account. We do not sell it.",
    ],
    todo: "confirm whether any content is used to improve models, and say so plainly either way",
  },
  {
    heading: "Other services this site loads",
    body: [
      "The site currently loads Google sign-in, Google Analytics, Vercel Analytics and PostHog product analytics. Each of those sees that you visited and sets its own cookies.",
    ],
    todo: "confirm this list, add the payment processor and the AI provider, and link their policies",
  },
  {
    heading: "Cookies",
    body: [
      "Signing in sets a session cookie so you stay logged in. The analytics services above set their own cookies.",
    ],
    todo: "whether you need a consent banner for visitors in the EU and UK",
  },
  {
    heading: "Getting your data out, or deleted",
    body: [
      "Ask us and we will export or delete your account along with the content trained under it. Deleting a chatbot removes it from your dashboard.",
    ],
    todo: "how long backups keep a copy after deletion, and how fast you commit to responding",
  },
  {
    heading: "Where it is processed",
    body: [
      "The service runs on hosted infrastructure rather than our own machines, so your content is processed by the providers listed above.",
    ],
    todo: "hosting regions, the full sub-processor list, and transfer terms for customers outside them",
  },
  {
    heading: "Changes to this policy",
    body: [
      "If what we collect or who sees it changes, we will update this page and say so by email before the change takes effect.",
    ],
  },
]

export default function PrivacyPage() {
  return (
    <main className="tc-marketing min-h-screen bg-background">
      <Header />

      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="tc-eyebrow">Legal</p>
        <h1 className="tc-display tc-display-lg mt-3">Privacy policy</h1>
        <p className="tc-path mt-4 text-muted-foreground">status: draft, not yet reviewed</p>

        <div className="mt-8 rounded-lg border border-warning-border bg-warning-soft p-5">
          <p className="tc-eyebrow">Read this first</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            This is a plain-language skeleton written by the team, not legal advice and not
            reviewed by a lawyer. It describes what the product appears to do today; every line
            needs to be checked against reality before it can be published as a policy. The
            bracketed notes mark what is still missing.
          </p>
        </div>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="tc-display tc-display-md">{section.heading}</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.todo ? (
                  <p className="rounded-sm bg-warning-soft px-2 py-1 font-mono text-xs text-foreground">
                    [needs review: {section.todo}]
                  </p>
                ) : null}
              </div>
            </section>
          ))}

          <section>
            <h2 className="tc-display tc-display-md">Contact</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">
              <p>
                Privacy questions and deletion requests can go to{" "}
                <a
                  href="mailto:sales@turbochat.live"
                  className="font-medium text-signal underline decoration-signal-border underline-offset-4 transition-colors hover:decoration-signal"
                >
                  sales@turbochat.live
                </a>{" "}
                for now. The{" "}
                <Link
                  href="/terms"
                  className="font-medium text-signal underline decoration-signal-border underline-offset-4 transition-colors hover:decoration-signal"
                >
                  terms of service
                </Link>{" "}
                cover the rest of the arrangement.
              </p>
              <p className="rounded-sm bg-warning-soft px-2 py-1 font-mono text-xs text-foreground">
                [needs review: a privacy contact address someone actually monitors]
              </p>
            </div>
          </section>
        </div>
      </article>

      <Footer />
    </main>
  )
}
