import type React from "react"
import type { Metadata } from "next"
import { Manrope } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LenisProvider } from "../components/provider/lenis-provider"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "https://turbochat.live"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Turbochat AI | AI Chatbot for Your Website",
    template: "%s | Turbochat AI",
  },
  description:
    "Turbochat AI helps you launch a website chatbot in minutes using your existing pages, docs, and knowledge base.",
  applicationName: "Turbochat AI",
  keywords: [
    "Turbochat",
    "Turbochat AI",
    "AI chatbot",
    "website AI assistant",
    "support automation",
    "RAG chatbot",
    "chatbot for SaaS",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Turbochat AI",
    title: "Turbochat AI | AI Chatbot for Your Website",
    description: "Build and deploy a source-grounded chatbot for your website with Turbochat AI.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Turbochat AI | AI Chatbot for Your Website",
    description: "Turn your website into a premium AI assistant with Turbochat AI.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Turbochat AI",
  url: siteUrl,
  description: "Turbochat AI helps you create a website chatbot trained on your own content.",
  publisher: {
    "@type": "Organization",
    name: "Turbochat AI",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cal+Sans&family=Instrument+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${manrope.variable} font-sans antialiased bg-zinc-950 text-zinc-100`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <LenisProvider>{children}</LenisProvider>
        <Analytics />
      </body>
    </html>
  )
}