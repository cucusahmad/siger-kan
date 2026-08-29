import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SIGER-KAN - Gerai Mutu dan Perikanan",
    short_name: "SIGER-KAN",
    description:
      "Platform terintegrasi untuk layanan mutu dan usaha perikanan Lampung.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#073B4C",
    lang: "id-ID",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/siger-kan-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/siger-kan-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
