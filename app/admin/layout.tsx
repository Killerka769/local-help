import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Админ-панель",
  description: "Управление платформой: пользователи, жалобы, заявки, статистика.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}