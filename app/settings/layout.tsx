import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Настройки",
  description: "Настройки пользователя",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}