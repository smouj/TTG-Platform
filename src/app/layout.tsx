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
  "Collect, trade & battle with 319 classic tazos from Pokemon, Dragon Ball Z and Digimon. Real-time physics arena with 9 combat stats, multiplayer PvP, and digital album scanning.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Collect, Trade & Battle Your Tazos`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: [
    "tazos", "pogs", "trading tazos game", "ttg", "medaclawarena",
    "pokemon tazos", "dragon ball z tazos", "digimon tazos",
    "collectible game", "physics battle", "digital album", "scanner",
    "multiplayer battle", "pvp tazos", "trading card game",
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
      { url: "/logo/ttg-logo-icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/logo/logo-icon-black.png", sizes: "512x512" },
    ],
    other: [{ rel: "mask-icon", url: "/logo/ttg-logo-icon.svg", color: "#FFCC00" }],
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
      alt: "Trading Tazos Game — 319 tazos from Pokemon, DBZ & Digimon",
    }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@medaclawarena",
    creator: "@medaclawarena",
    title: `${SITE_NAME} — Collect, Trade & Battle Your Tazos`,
    description: "319 classic tazos. 9 combat stats. Real-time physics arena. Battle your friends online.",
    images: [`${SITE_URL}/logo/social-preview.png`],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en": `${SITE_URL}/en`,
      "es": `${SITE_URL}/es`,
      "pt": `${SITE_URL}/pt`,
      "de": `${SITE_URL}/de`,
      "fr": `${SITE_URL}/fr`,
      "it": `${SITE_URL}/it`,
      "ja": `${SITE_URL}/ja`,
      "ko": `${SITE_URL}/ko`,
      "zh": `${SITE_URL}/zh`,
      "ru": `${SITE_URL}/ru`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
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
              "operatingSystem": "Web, Windows, macOS, Linux",
              "applicationCategory": "Game",
              "author": {
                "@type": "Organization",
                "name": "MedaClaw Arena",
                "url": SITE_URL,
                "email": "support@medaclawarena.com",
              },
              "genre": ["Collectible", "Battle", "Physics", "Multiplayer", "Nostalgia"],
              "numberOfPlayers": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2 },
              "gamePlatform": ["Web Browser", "PC", "Mac", "Linux"],
              "inLanguage": ["en", "es", "pt", "de", "fr", "it", "ja", "ko", "zh", "ru"],
            }),
          }}
        />
        <meta name="theme-color" content="#FFCC00" />
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
