import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import I18nClientWrapper from "@/components/i18n-client-wrapper";
import AuthProviderComponent from "@/components/auth-provider";
import CookieConsentBanner from "@/components/ui/cookie-consent-banner";
import ScrollReveal from "@/components/scroll-reveal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://tradingtazosgame.com";
const SITE_NAME = "Trading Tazos Game";
const SITE_DESC =
  "Collect, trade and battle with 349 classic tazos from Minimon, Dracobell and Cybermon. Build a 2D album, open tazo bags, and compete in a skill-based 3D battle arena.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Collect, Trade & Battle Your Tazos`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: [
    "tazos", "pogs", "trading tazos game", "ttg",
    "minimon tazos", "dracobell tazos", "cybermon tazos",
    "collectible game", "physics battle", "digital album", "battle",
    "multiplayer battle", "pvp tazos", "3d battle arena",
    "90s collectibles", "nostalgia game",
  ],
  authors: [{ name: "Trading Tazos Game", url: SITE_URL }],
  creator: "Trading Tazos Game",
  publisher: "Trading Tazos Game",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  verification: {
    google: "EAAXqgCvVmcAH0VR2V6nPL7Y0dOlr46BfhWfylwS8BA",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Collect, Trade & Battle Your Tazos`,
    description: SITE_DESC,
    url: SITE_URL,
    locale: "en_US",
    images: [{
      url: `${SITE_URL}/logo/social-preview.webp`,
      width: 1200,
      height: 630,
      alt: "Trading Tazos Game — 349 tazos from Minimon, Dracobell & Cybermon",
    }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@tazosgame",
    creator: "@tazosgame",
    title: `${SITE_NAME} — Collect, Trade & Battle Your Tazos`,
    description: "349 classic tazos, 3 collections, 9 combat stats, 2D collection views, and a skill-based 3D battle arena.",
    images: [`${SITE_URL}/logo/social-preview.webp`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden" suppressHydrationWarning>
      <head>
        {/* JSON-LD structured data for VideoGame */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "VideoGame",
              "name": "Trading Tazos Game",
              "description": SITE_DESC,
              "url": SITE_URL,
              "image": `${SITE_URL}/logo/social-preview.webp`,
              "operatingSystem": "Web, Linux",
              "applicationCategory": "Game",
              "author": {
                "@type": "Organization",
                "name": "Trading Tazos Game",
                "url": SITE_URL,
                "email": "support@tradingtazosgame.com",
                "sameAs": [
                  "https://x.com/tazosgame",
                  "https://www.reddit.com/r/tradingtazosgame/",
                  "https://t.me/tradingtazosgame",
                  "https://github.com/smouj/Trading-Tazos-Game"
                ]
              },
              "genre": ["Collectible", "Battle", "Physics", "Multiplayer", "Nostalgia"],
              "numberOfPlayers": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2 },
              "gamePlatform": ["Web Browser", "Linux"],
              "inLanguage": "en",
            }),
          }}
        />
        <meta name="theme-color" content="#FFCC00" />
        <meta name="google-adsense-account" content="ca-pub-4932643710484609" />
        <meta name="geo.region" content="ES" />
        <meta name="geo.placename" content="Spain" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TTG" />
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4932643710484609"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden bg-background text-foreground`}
      >
        <I18nClientWrapper>
          <AuthProviderComponent>
            <ScrollReveal />
            {children}
          </AuthProviderComponent>
        </I18nClientWrapper>
        <Toaster />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
