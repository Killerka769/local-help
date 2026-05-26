import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Как это работает",
  description: "Инструкция по использованию Local Help: для заказчиков и исполнителей.",
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}