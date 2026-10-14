import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";

/* The Registry type system — one superfamily, three voices:
   Plex Serif for display/registry headings, Plex Sans for UI text,
   Plex Mono for evidence, ids and hashes. Loaded once here so every
   machine renders identical type (no per-OS fallback drift). */
const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-plex-serif",
  display: "swap",
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pramaan — Evidence-first privacy operations",
  description:
    "Pramaan is the evidence-first privacy operations registry for India's DPDP Act, 2023: consent ledger, rights desk, breach resolution, data mapping and tamper-evident proof.",
};

export const viewport: Viewport = {
  themeColor: "#f6f4ee",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSerif.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
