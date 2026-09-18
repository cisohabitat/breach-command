import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Breach Command | Solo Incident Response",
  description: "Lead a single-player cyber incident investigation. Play procedures, uncover four hidden attack stages and learn with a computer Incident Captain.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
