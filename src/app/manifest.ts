import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Navqiron — Yunusobod yoshlar platformasi",
    short_name: "Navqiron",
    description:
      "Yunusobod tumanidagi tadbirlar, musobaqalar va yoshlar uchun foydali joylar — bitta interaktiv xaritada.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07040f",
    theme_color: "#07040f",
    lang: "uz",
    categories: ["education", "social", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
