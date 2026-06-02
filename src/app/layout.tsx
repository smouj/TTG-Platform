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
  title: "Tazos Legends Arena",
  description: "Escanea tus tazos antiguos, crea tu album digital y hazlos combatir en una arena fisica",
  keywords: ["tazos", "pogs", "collectibles", "trading", "game", "Pokemon", "Digimon", "Dragon Ball Z"],
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
