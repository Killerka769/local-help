import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Мои отклики | Local Help",
  description: "Откликик пользователя на заявки",
};

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}