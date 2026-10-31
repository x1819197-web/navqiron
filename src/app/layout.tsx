import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Navqiron — Yunusobod yoshlar platformasi",
  description:
    "Yunusobod tumanidagi tadbirlar, musobaqalar va yoshlar uchun foydali joylar — bitta interaktiv xaritada.",
  applicationName: "Navqiron",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Navqiron",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  keywords: [
    "Yunusobod",
    "yoshlar",
    "tadbirlar",
    "musobaqalar",
    "Toshkent",
    "Navqiron",
    "youth",
  ],
  openGraph: {
    title: "Navqiron — Yunusobod yoshlar platformasi",
    description:
      "Yunusobodda nima bo'lyapti? Tadbirlar, musobaqalar va imkoniyatlar bitta xaritada.",
    type: "website",
    locale: "uz_UZ",
  },
};

export const viewport: Viewport = {
  themeColor: "#07040f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
