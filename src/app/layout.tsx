import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import I18nClientWrapper from "@/components/i18n-client-wrapper";
import AuthProviderComponent from "@/components/auth-provider";
import CookieConsentBanner from "@/components/ui/cookie-consent-banner";
import ScrollReveal from "@/components/scroll-reveal";
import { SITE_CONFIG } from "@/lib/site-config";
import { generateFaqJsonLd } from "@/lib/faq-content";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const { canonicalUrl: SITE_URL, name: SITE_NAME, version: VERSION } = SITE_CONFIG;
const SITE_DESC =
  `Collect, trade and battle with ${SITE_CONFIG.totalTazos} tazos from Minimon, Dracobell and Cybermon. Build a 2D album, open tazo bags, and compete in a skill-based 3D battle arena.`;

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
    "digital collectibles", "skill game",
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
      alt: `Trading Tazos Game — ${SITE_CONFIG.totalTazos} tazos from Minimon, Dracobell & Cybermon`,
    }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@tazosgame",
    creator: "@tazosgame",
    title: `${SITE_NAME} — Collect, Trade & Battle Your Tazos`,
    description: `${SITE_CONFIG.totalTazos} tazos, 3 collections, ${SITE_CONFIG.statsCount} combat stats, 2D collection views, and a skill-based 3D battle arena.`,
    images: [`${SITE_URL}/logo/social-preview.webp`],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en": SITE_URL,
      "es": `${SITE_URL}/?lang=es`,
    },
  },
};

const ADSENSE_ENABLED = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true"

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
              "name": SITE_NAME,
              "description": SITE_DESC,
              "url": SITE_URL,
              "image": `${SITE_URL}/logo/social-preview.webp`,
              "operatingSystem": "Web, Linux",
              "applicationCategory": "Game",
              "author": {
                "@type": "Organization",
                "name": SITE_NAME,
                "url": SITE_URL,
                "email": SITE_CONFIG.supportEmail,
                "sameAs": Object.values(SITE_CONFIG.social)
              },
              "genre": ["Collectible", "Battle", "Physics", "Multiplayer", "Nostalgia"],
              "numberOfPlayers": { "@type": "QuantitativeValue", "minValue": 1, "maxValue": 2 },
              "gamePlatform": ["Web Browser", "Linux"],
              "inLanguage": "en",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            }),
          }}
        />
        {/* JSON-LD WebSite + SearchAction for Google Sitelinks */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Trading Tazos Game",
              "url": SITE_URL,
              "description": SITE_DESC,
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${SITE_URL}/?page=tazos&q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />
        {/* JSON-LD Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": SITE_NAME,
              "url": SITE_URL,
              "description": `${SITE_CONFIG.disclaimer} — collect, trade, and battle with ${SITE_CONFIG.totalTazos} tazos across ${SITE_CONFIG.totalSeries} franchises.`,
              "email": SITE_CONFIG.supportEmail,
              "logo": `${SITE_URL}/pwa-512.webp`,
              "sameAs": [
                SITE_CONFIG.social.x,
                SITE_CONFIG.social.github
              ]
            }),
          }}
        />
        {/* JSON-LD FAQPage — synced with src/lib/faq-content.ts */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFaqJsonLd()),
          }}
        />
        {/* JSON-LD BreadcrumbList */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": SITE_URL
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Collections",
                  "item": `${SITE_URL}/?page=collections`
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "Tazo Catalog",
                  "item": `${SITE_URL}/?page=tazos`
                }
              ]
            }),
          }}
        />
        <meta name="theme-color" content="#FFCC00" />
        {ADSENSE_ENABLED && (
          <meta name="google-adsense-account" content="ca-pub-4932643710484609" />
        )}
        <meta name="geo.region" content="ES" />
        <meta name="geo.placename" content="Spain" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TTG" />
        {/* Google Consent Mode v2 — default to denied, updated by CMP banner */}
        {ADSENSE_ENABLED && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('consent', 'default', {
                  ad_storage: 'denied',
                  ad_user_data: 'denied',
                  ad_personalization: 'denied',
                  analytics_storage: 'denied',
                  wait_for_update: 500
                });
                gtag('set', 'ads_data_redaction', true);
              `,
            }}
          />
        )}
        {/* Google Funding Choices — CMP for EEA/UK */}
        {ADSENSE_ENABLED && (
          <script
            async
            src="https://fundingchoicesmessages.google.com/i/pub-4932643710484609?ers=1"
          />
        )}
        {/* Plausible Analytics — privacy-first, no cookies */}
        <script defer data-domain="tradingtazosgame.com" src="https://plausible.rpgclaw.com/js/script.js" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden bg-background text-foreground`}
      >
        <a href="#main-content" className="skip-to-content">Skip to content</a>
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
