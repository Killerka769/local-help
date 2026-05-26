import type { Metadata } from "next";
import "./globals.scss";
import Header from "./components/layout/Header/Header";
import Footer from "./components/layout/Footer/Footer";
import Providers from "./providers";
import EmailWarning from "./components/EmailWarning/EmailWarning";

export const metadata: Metadata = {
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Local Help — помощь соседей",
    description: "Быстрая помощь по дому от соседей. Ремонт, переезд, присмотр, бытовые проблемы",
    url: "https://localhelp.ru",
    siteName: "Local Help",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Local Help — помощь соседей",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Local Help — помощь соседей",
    description: "Быстрая помощь по дому от соседей",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  verification: {
    google: "ваш_код_верификации", // добавить позже
    yandex: "ваш_код_верификации", // добавить позже
  },
  alternates: {
    canonical: "https://localhelp.ru",
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
          {/* <EmailWarning /> */}
          {children}
          <Footer />
        </Providers>
        </body>
    </html>
  );
}
