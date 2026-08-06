// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Poker by BruCe",
  description: "Texas Hold'em Poker Game",
};

// 🔥 NOVO: viewport explícito. Garante que o navegador use a largura real
// do dispositivo (device-width) e não uma largura virtual maior, o que
// poderia fazer as media queries de mobile (max-width: 480px etc.) não
// corresponderem corretamente em alguns WebViews/navegadores.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
      style={{
        margin: 0,
        padding: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <body
        className="min-h-full"
        style={{
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          margin: 0,
          padding: 0,
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
