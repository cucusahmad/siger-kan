import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIGER-KAN | Sistem Informasi Terintegrasi Gerai Mutu dan Perikanan",
  description:
    "Platform terintegrasi untuk layanan pengujian mutu, sertifikasi, konsultasi, pengetahuan, dan kemitraan usaha perikanan.",
  icons: { icon: "/siger-kan-mark.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="antialiased">
      <body>{children}</body>
    </html>
  );
}
