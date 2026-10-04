import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// The case-file faces: a serif for case titles and headings, a mono for data —
// rolls, timestamps, identifiers. Self-hosted, so offline play keeps them.
const display = localFont({
  src: "./fonts/source-serif-4.woff2",
  weight: "400 700",
  variable: "--font-display",
  display: "swap",
});
const data = localFont({
  src: [
    { path: "./fonts/plex-mono-400.woff2", weight: "400" },
    { path: "./fonts/plex-mono-500.woff2", weight: "500" },
    { path: "./fonts/plex-mono-600.woff2", weight: "600" },
  ],
  variable: "--font-data",
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
    <html lang="en" className={`${display.variable} ${data.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
