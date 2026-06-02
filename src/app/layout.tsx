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

export const metadata: Metadata = {
  title: "Trading Tazos Game",
  description: "Escanea tus tazos antiguos, crea tu álbum digital y hazlos combatir en una arena física | Scan your old tazos, build your digital album, and battle them in a physics arena",
  keywords: ["tazos", "pogs", "collectibles", "trading", "game", "Pokemon", "Digimon", "Dragon Ball Z", "battle"],
  icons: {
    icon: "/favicon.png",
    apple: "/logo/logo-icon-black.png",
  },
  openGraph: {
    title: "Trading Tazos Game",
    description: "Battle your tazos in a real-time physics arena",
    url: "https://medaclawarena.com",
    siteName: "Trading Tazos Game",
    images: [
      {
        url: "https://medaclawarena.com/logo/social-preview.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trading Tazos Game",
    description: "Battle your tazos in a real-time physics arena",
    images: ["https://medaclawarena.com/logo/social-preview.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
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
