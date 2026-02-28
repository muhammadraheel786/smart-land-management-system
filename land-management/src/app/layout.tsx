import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const SITE_URL = "https://www.mashorifarm.com";
const SITE_NAME = "Mashori Farm";
const DEFAULT_DESC = "Mashori Farm – Smart land & farm management. AI-powered geo-fencing, crop analytics, expense tracking, Thaka management, and insights for Pakistani farmers and landowners.";

const outfit = Outfit({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1419" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mashori Farm | Smart Land & Farm Management – AI-Powered",
    template: "%s | Mashori Farm",
  },
  description: DEFAULT_DESC,
  keywords: [
    "Mashori Farm",
    "farm management",
    "land management",
    "agriculture Pakistan",
    "geo-fencing",
    "crop analytics",
    "expense tracking",
    "Thaka management",
    "AI farm",
    "smart farming",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Mashori Farm | Smart Land & Farm Management",
    description: DEFAULT_DESC,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mashori Farm | Smart Land & Farm Management",
    description: DEFAULT_DESC,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "Agriculture",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DEFAULT_DESC,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-US",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${outfit.variable} ${jetbrains.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
