import Link from "next/link"

export function BlogSection() {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 text-sm border rounded-full mb-6">Blog</span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-balance">
            Latest from TurboChat
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Guides and resources to help you train AI chatbots, reduce support tickets, and deliver
            better customer service with AI.
          </p>
        </div>

        <Link href="/blog" className="block group">
          <div className="bg-card border rounded-2xl p-8 hover:shadow-md transition-shadow">
            <p className="text-xs text-muted-foreground mb-3">Guide &middot; June 2026</p>
            <h3 className="font-serif text-2xl mb-3 group-hover:text-foreground/80 transition-colors">
              How to Train AI Chatbot on Website Docs: A Step-by-Step Guide
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Manually answering repetitive customer support tickets drains your team&apos;s time.
              Learn how to train an AI chatbot on website docs to automate customer service with
              accurate, source-grounded answers using a RAG chatbot platform.
            </p>
            <span className="text-sm font-medium text-foreground group-hover:underline">
              Read more &rarr;
            </span>
          </div>
        </Link>
      </div>
    </section>
  )
}
