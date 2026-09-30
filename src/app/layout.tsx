import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pramaan — Evidence-first privacy operations",
  description:
    "Pramaan is the evidence-first privacy operations registry for India's DPDP Act, 2023: consent ledger, rights desk, breach resolution, data mapping and tamper-evident proof.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
