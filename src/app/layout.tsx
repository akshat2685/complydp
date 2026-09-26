import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "complyDP — Privacy Operations Center",
  description:
    "AI-native Privacy Operations Center for India. Continuous discovery, classification, consent tracking, and regulatory obligation enforcement under the DPDP Act.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8f9fa] antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
