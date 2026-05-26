import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Создание заявки | Local Help",
  description: "Создайте заявку на помощь. Укажите задачу, бюджет и срок.",
};

export default function NewRequestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}