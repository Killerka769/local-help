import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Мой профиль",
  description: "Управление профилем: редактирование данных, просмотр заявок и откликов.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}