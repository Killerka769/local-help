import type { Metadata } from "next";
import "./globals.scss";
import Header from "./components/layout/Header/Header";
import Footer from "./components/layout/Footer/Footer";
import Providers from "./providers";

import { getSiteUrl } from "@/lib/jwt";

const siteUrl = getSiteUrl();
const hasPublicSite = Boolean(process.env.NEXT_PUBLIC_SITE_URL);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Local Help — помощь соседей",
    template: "%s | Local Help",
  },
  description: "Быстрая помощь по дому от соседей. Ремонт, переезд, присмотр, бытовые услуги.",
  keywords: [
    "помощь соседей",
    "ремонт в махачкале",
    "переезд помощь",
    "бытовые услуги",
    "помощь по дому",
    "соседская помощь",
    "мастер на час",
    "бытовые проблемы",
    "срочная проблема",
    "работа"
  ].join(", "),
  authors: [{ name: "Local Help" }],
  creator: "Local Help",
  publisher: "Local Help",
  robots: hasPublicSite
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      }
    : { index: false, follow: false },
  openGraph: {
    title: "Local Help — помощь соседей",
    description: "Быстрая помощь по дому от соседей. Ремонт, переезд, присмотр, бытовые проблемы",
    url: siteUrl,
    siteName: "Local Help",
    images: [],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Local Help — помощь соседей",
    description: "Быстрая помощь по дому от соседей",
    images: [],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: hasPublicSite ? siteUrl : undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
        </body>
    </html>
  );
}
