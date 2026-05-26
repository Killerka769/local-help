import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Мои заявки",
  description: "Просмотр заявок пользователя, а так же создание заявок",
};

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}