import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Turbochat AI - Modern Way to Use ChatBots',
  description: 'Build, train, and deploy intelligent AI chatbots for your website',
};

import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>{children}<Analytics/></Providers>
      </body>
    </html>
  );
}