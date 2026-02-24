"use client"

import { motion } from "framer-motion"
import { Zap, Globe, Code2, Sparkles, ArrowRight, MessageSquare } from "lucide-react"
import { Card, CardContent } from "@/landing/components/ui/card"

const integrationLogos = [
  { name: "WordPress" },
  { name: "Shopify" },
  { name: "Webflow" },
  { name: "React" },
  { name: "Next.js" },
  { name: "Wix" },
  { name: "Squarespace" },
  { name: "Framer" },
]

export function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Features</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-zinc-100 mb-4">
            Powerful AI for any website
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto text-balance">
            Everything you need to turn your website into a 24/7 AI-powered support engine.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Card 1 - Automated Scraping (wider - 3 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-3"
          >
            <Card className="group h-full overflow-hidden border-zinc-800/50 bg-zinc-900/50 hover:border-zinc-700/50 transition-all duration-300 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Globe className="w-5 h-5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                  </motion.div>
                  <p className="font-heading font-semibold text-zinc-100">Automated Knowledge Extraction</p>
                </div>
                <p className="text-zinc-500 text-sm mb-5">
                  Our crawler automatically navigates your site, extracts content, and builds a comprehensive knowledge base.
                </p>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-zinc-500 font-mono">Crawling: example.com/blog/...</div>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  </div>
                  {/* Animated crawling list */}
                  <div className="space-y-2">
                    {[
                      { url: "/about", status: "Index complete", size: "12kb" },
                      { url: "/products", status: "Processing...", size: "45kb" },
                      { url: "/pricing", status: "Pending", size: "-" },
                    ].map((item, i) => (
                      <motion.div
                        key={item.url}
                        className="flex items-center justify-between bg-zinc-900/50 rounded-lg p-2 text-[10px]"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        <span className="text-zinc-300 font-mono">{item.url}</span>
                        <span className={item.status === "Index complete" ? "text-emerald-500" : "text-zinc-500"}>
                          {item.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2 - Speed (narrower - 2 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-2"
          >
            <Card className="group h-full overflow-hidden border-zinc-800/50 bg-zinc-900/50 hover:border-zinc-700/50 transition-all duration-300 rounded-2xl">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  >
                    <Zap className="w-5 h-5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                  </motion.div>
                  <p className="font-heading font-semibold text-zinc-100">Instant Training</p>
                </div>
                <p className="text-zinc-500 text-sm mb-5">From URL to functional AI in under 10 seconds.</p>
                <div className="mt-auto">
                  <div className="flex items-baseline gap-2 mb-3">
                    <motion.span
                      className="text-4xl font-display font-bold text-zinc-100"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                    >
                      &lt;10s
                    </motion.span>
                    <span className="text-zinc-500 text-sm">generation time</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500/50 to-emerald-300 rounded-full"
                      initial={{ width: "0%" }}
                      whileInView={{ width: "95%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 3 - Embed (narrower - 2 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-2"
          >
            <Card className="group h-full overflow-hidden border-zinc-800/50 bg-zinc-900/50 hover:border-zinc-700/50 transition-all duration-300 rounded-2xl">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center"
                    whileHover={{ y: -2 }}
                  >
                    <Code2 className="w-5 h-5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                  </motion.div>
                  <p className="font-heading font-semibold text-zinc-100">Simple Embedding</p>
                </div>
                <p className="text-zinc-500 text-sm mb-5">One line of code to deploy on any platform.</p>
                <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 font-mono text-[10px] text-zinc-400 mt-auto">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                  </div>
                  <code className="block text-zinc-300 break-all">
                    {`<script src="https://sitechat.ai/widget.js" data-id="xyz-123"></script>`}
                  </code>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 4 - Conversations (wider - 3 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="md:col-span-3"
          >
            <Card className="group h-full overflow-hidden border-zinc-800/50 bg-zinc-900/50 hover:border-zinc-700/50 transition-all duration-300 rounded-2xl">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center"
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.4 }}
                  >
                    <MessageSquare className="w-5 h-5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                  </motion.div>
                  <p className="font-heading font-semibold text-zinc-100">Intelligent Conversations</p>
                </div>
                <p className="text-zinc-500 text-sm mb-5">AI that remembers context and provides accurate answers from your data.</p>
                <div className="grid grid-cols-4 gap-2 mt-auto">
                  {integrationLogos.map((logo, i) => (
                    <motion.div
                      key={logo.name}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                      whileHover={{ scale: 1.15, y: -2 }}
                      className="aspect-square rounded-lg border border-zinc-800 bg-zinc-800/50 flex flex-col items-center justify-center cursor-pointer p-1"
                    >
                      <div className="text-[8px] text-zinc-500 font-medium text-center">{logo.name}</div>
                    </motion.div>
                  ))}
                </div>
                <motion.button
                  whileHover={{ x: 6 }}
                  className="mt-4 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Works with all major platforms <ArrowRight className="w-4 h-4" />
                </motion.button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
