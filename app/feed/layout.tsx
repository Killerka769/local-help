import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Лента заявок",
  description: "Все активные заявки на помощь в вашем городе. Найдите задачу или исполнителя рядом с домом.",
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}