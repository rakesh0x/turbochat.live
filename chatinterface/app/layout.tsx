import type { Metadata } from "next";
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css'
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script";

import Image from "next/image";

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "https://turbochat.live";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Turbochat AI | AI Chatbot for Your Website — Train on Docs & Deploy in Minutes",
    template: "%s | Turbochat AI",
  },
  icons: {
    icon: '/Turbochatlogo.png'
  },
  description: "Create, train, and deploy an AI chatbot for your website in minutes. Turbochat is a RAG chatbot platform for customer service that learns from your help center, PDFs, and product docs to answer support tickets automatically. The best custom AI chatbot for SaaS support — an affordable Intercom alternative for startups.",
  applicationName: "Turbochat AI",
  keywords: [
    "Turbochat",
    "Turbochat AI",
    "AI chatbot",
    "website chatbot",
    "customer support chatbot",
    "RAG chatbot",
    "RAG chatbot platform for customer service",
    "chatbot for website",
    "AI support agent",
    "how to train AI chatbot on website docs",
    "best custom AI chatbot for SaaS support",
    "embed AI support widget on website",
    "how to reduce customer support ticket volume with AI",
    "affordable Intercom alternatives for startup support",
    "AI chatbot training",
    "support ticket automation",
    "AI customer support",
  ],
  alternates: {
    canonical: "/",
  },
  other: {
    "sigentra-verify": "5f9f3db4-21fd-4143-8db1-3ba5bf5f9e3c"
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Turbochat AI",
    title: "Turbochat AI | AI Chatbot for Your Website — Train on Docs & Deploy in Minutes",
    description: "Create, train, and deploy an AI chatbot for your website in minutes. Turbochat is a RAG chatbot platform that learns from your help center, PDFs, and product docs.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Turbochat AI | AI Chatbot for Your Website",
    description: "Build a source-grounded RAG chatbot for your site with Turbochat AI. Train on docs, embed on your site, and cut support tickets.",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Turbochat AI",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description: "Turbochat AI helps businesses create AI chatbots trained on website content, PDFs, and help center docs. A RAG chatbot platform for customer service.",
      brand: {
        "@type": "Brand",
        name: "Turbochat AI",
      },
      offers: [
        { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
        { "@type": "Offer", name: "Pro", price: "29", priceCurrency: "USD" },
        { "@type": "Offer", name: "Enterprise", price: "99", priceCurrency: "USD" },
      ],
    },
    {
      "@type": "WebSite",
      name: "Turbochat AI",
      url: siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      name: "Turbochat AI",
      url: siteUrl,
      logo: `${siteUrl}/Turbochatlogo.png`,
      description: "AI chatbot platform for customer support automation.",
    },
  ],
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ZGFGY6QD5V"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-ZGFGY6QD5V');
          `}
        </Script>

        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&display=swap"
          rel="stylesheet"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>

      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}