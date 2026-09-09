import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms that apply when you use TurboChat. A working draft, written in plain language and pending review.",
  alternates: { canonical: "/terms" },
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
    heading: "Who you are dealing with",
    body: [
      "TurboChat is a hosted service: you point it at content you are allowed to use, and it answers your customers from that content. These terms cover everyone who signs in and every widget installed on a site.",
    ],
    todo: "legal entity name, registered address, and the country whose law applies",
  },
  {
    heading: "Your account",
    body: [
      "You sign in with Google. Whatever happens under your account is your responsibility, so keep that sign-in secure and tell us if you think someone else has it.",
    ],
  },
  {
    heading: "The content you add",
    body: [
      "Only add pages, files and links you own or have permission to use. TurboChat reads what you give it and answers from it, which means anything you add can be quoted back to your customers.",
      "Your content stays yours. We use it to run the service for you, not for anything else.",
    ],
  },
  {
    heading: "What you may not do",
    body: [
      "No unlawful or deliberately harmful content, no attempts to break, overload or reverse the service, and no reselling it as your own product without a written agreement.",
    ],
  },
  {
    heading: "Plans and payment",
    body: [
      "Current plans and prices are on the pricing page. Paid plans renew until you cancel, and cancelling stops the next renewal rather than the current one.",
    ],
    todo: "billing cycle, refund policy, tax handling, and the payment processor you use",
  },
  {
    heading: "Answers are generated",
    body: [
      "Answers are assembled from the content you added, and each one names the page it came from. Check them before relying on them for anything that carries real consequences.",
    ],
    todo: "any uptime or support-response commitment you are willing to make",
  },
  {
    heading: "Liability and disputes",
    body: [
      "This is the part where invented wording does real damage, so there is none here. A lawyer needs to write it for your jurisdiction and your risk.",
    ],
    todo: "limitation of liability, warranties, indemnity, governing law, and dispute resolution",
  },
  {
    heading: "Ending it",
    body: [
      "You can delete your chatbots and stop using TurboChat whenever you like. We can suspend an account that breaks these terms, and we will tell you why when we do.",
    ],
  },
  {
    heading: "Changes to these terms",
    body: [
      "If these terms change in a way that affects you, we will update this page and say so by email before the change takes effect.",
    ],
  },
]

export default function TermsPage() {
  return (
    <main className="tc-marketing min-h-screen bg-background">
      <Header />

      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="tc-eyebrow">Legal</p>
        <h1 className="tc-display tc-display-lg mt-3">Terms of service</h1>
        <p className="tc-path mt-4 text-muted-foreground">status: draft, not yet reviewed</p>

        <div className="mt-8 rounded-lg border border-warning-border bg-warning-soft p-5">
          <p className="tc-eyebrow">Read this first</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            This is a plain-language skeleton written by the team, not legal advice and not
            reviewed by a lawyer. Every section below needs to be confirmed, replaced or deleted
            before it can be treated as binding. The bracketed notes mark what is still missing.
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
                {section.heading === "Plans and payment" ? (
                  <p>
                    <Link
                      href="/pricing"
                      className="font-medium text-signal underline decoration-signal-border underline-offset-4 transition-colors hover:decoration-signal"
                    >
                      See the plans
                    </Link>
                  </p>
                ) : null}
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
                Questions about these terms can go to{" "}
                <a
                  href="mailto:sales@turbochat.live"
                  className="font-medium text-signal underline decoration-signal-border underline-offset-4 transition-colors hover:decoration-signal"
                >
                  sales@turbochat.live
                </a>{" "}
                for now.
              </p>
              <p className="rounded-sm bg-warning-soft px-2 py-1 font-mono text-xs text-foreground">
                [needs review: a legal contact address someone actually monitors]
              </p>
            </div>
          </section>
        </div>
      </article>

      <Footer />
    </main>
  )
}
