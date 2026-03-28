import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from "@vercel/analytics/next"
import Image from "next/image";

const inter = Inter({ subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "https://turbochat.live";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Turbochat AI | AI Chatbot for Your Website",
    template: "%s | Turbochat AI",
  },
  icons: {
    icon: '/Turbochatlogo.png'
  },
  description: "Create, train, and deploy an AI chatbot for your website in minutes. Turbochat AI answers using your docs, pages, and product content.",
  applicationName: "Turbochat AI",
  keywords: [
    "Turbochat",
    "Turbochat AI",
    "AI chatbot",
    "website chatbot",
    "customer support chatbot",
    "RAG chatbot",
    "chatbot for website",
    "AI support agent",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Turbochat AI",
    title: "Turbochat AI | AI Chatbot for Your Website",
    description: "Create, train, and deploy an AI chatbot for your website in minutes.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Turbochat AI | AI Chatbot for Your Website",
    description: "Build a source-grounded chatbot for your site with Turbochat AI.",
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
};

import { Providers } from './providers';

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Turbochat AI",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: siteUrl,
  description: "Turbochat AI helps businesses create AI chatbots trained on website content.",
  brand: {
    "@type": "Brand",
    name: "Turbochat AI",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Jersey+10&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Providers>{children}<Analytics/></Providers>
      </body>
    </html>
  );
}