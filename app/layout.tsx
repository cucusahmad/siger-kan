import type { Metadata } from "next";
import "./globals.css";

const applicationUrl = new URL(
  process.env.APP_URL?.trim() || "https://sigerkan.ubl.ac.id",
);

export const metadata: Metadata = {
  metadataBase: applicationUrl,
  applicationName: "SIGER-KAN",
  title: "SIGER-KAN | Sistem Informasi Terintegrasi Gerai Mutu dan Perikanan",
  description:
    "Platform terintegrasi untuk layanan pengujian mutu, sertifikasi, konsultasi, pengetahuan, dan kemitraan usaha perikanan.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "SIGER-KAN",
    title: "SIGER-KAN | Sistem Informasi Terintegrasi Gerai Mutu dan Perikanan",
    description:
      "Platform terintegrasi untuk layanan pengujian mutu, sertifikasi, konsultasi, pengetahuan, dan kemitraan usaha perikanan.",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SIGER-KAN",
  },
  icons: {
    icon: "/siger-kan-mark.svg",
    apple: "/siger-kan-mark.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="antialiased">
      <body>{children}</body>
    </html>
  );
}
