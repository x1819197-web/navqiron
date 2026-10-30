import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Navqiron — Yunusobod yoshlar platformasi",
  description:
    "Yunusobod tumanidagi tadbirlar, musobaqalar va yoshlar uchun foydali joylar — bitta interaktiv xaritada.",
  applicationName: "Navqiron",
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
  themeColor: "#f2eee3",
  width: "device-width",
  initialScale: 1,
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
