import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import I18nClientWrapper from "@/components/i18n-client-wrapper";
import AuthProviderComponent from "@/components/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://medaclawarena.com";
const SITE_NAME = "Trading Tazos Game";
const SITE_DESC =
  "Collect, trade and battle with 319 classic tazos from Minimon, Dracobell and Cybermon. Build a 2D album, open tazo bags, and compete in a skill-based 3D battle arena.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Collect, Trade & Battle Your Tazos`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: [
    "tazos", "pogs", "trading tazos game", "ttg", "medaclawarena",
    "minimon tazos", "dracobell tazos", "cybermon tazos",
    "collectible game", "physics battle", "digital album", "scanner",
    "multiplayer battle", "pvp tazos", "3d battle arena",
    "90s collectibles", "nostalgia game",
  ],
  authors: [{ name: "MedaClaw Arena", url: SITE_URL }],
  creator: "MedaClaw Arena",
  publisher: "MedaClaw Arena",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
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
      url: `${SITE_URL}/logo/social-preview.png`,
      width: 1200,
      height: 630,
      alt: "Trading Tazos Game — 319 tazos from Minimon, Dracobell & Cybermon",
    }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@medaclawarena",
    creator: "@medaclawarena",
    title: `${SITE_NAME} — Collect, Trade & Battle Your Tazos`,
    description: "319 classic tazos, 3 collections, 9 combat stats, 2D collection views, and a skill-based 3D battle arena.",
    images: [`${SITE_URL}/logo/social-preview.png`],
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
    <html lang="en" className="dark" suppressHydrationWarning>
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
              "image": `${SITE_URL}/logo/social-preview.png`,
              "operatingSystem": "Web, Linux",
              "applicationCategory": "Game",
              "author": {
                "@type": "Organization",
                "name": "MedaClaw Arena",
                "url": SITE_URL,
                "email": "support@medaclawarena.com",
              },
              "genre": ["Collectible", "Battle", "Physics", "Multiplayer", "Nostalgia"],
              "numberOfPlayers": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2 },
              "gamePlatform": ["Web Browser", "Linux"],
              "inLanguage": "en",
            }),
          }}
        />
        <meta name="theme-color" content="#FFCC00" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TTG" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <I18nClientWrapper>
          <AuthProviderComponent>
            {children}
          </AuthProviderComponent>
        </I18nClientWrapper>
        <Toaster />
      </body>
    </html>
  );
}
