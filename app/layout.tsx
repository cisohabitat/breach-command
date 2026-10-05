import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// One face for headings, labels and figures: a condensed grotesk, the face of
// a printed form. Self-hosted, so offline play keeps it. Body text stays the
// system face, against which every wrap and fold measurement was taken.
const form = localFont({
  src: [
    { path: "./fonts/plex-sans-cond-400.woff2", weight: "400" },
    { path: "./fonts/plex-sans-cond-500.woff2", weight: "500" },
    { path: "./fonts/plex-sans-cond-600.woff2", weight: "600" },
    { path: "./fonts/plex-sans-cond-700.woff2", weight: "700" },
  ],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Breach Command | Solo Incident Response",
  description: "Lead a single-player cyber incident investigation. Play procedures, uncover four hidden attack stages and learn with a computer Incident Captain.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Breach Command",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#111417",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={form.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
