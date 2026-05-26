import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface RequestLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: RequestLayoutProps): Promise<Metadata> {
  const { id } = await params;
  
  const request = await prisma.request.findUnique({
    where: { id },
    include: { author: { select: { name: true } } },
  });

  if (!request) {
    return {
      title: "Заявка не найдена",
    };
  }

  const title = `${request.title}`;
  const description = request.description.slice(0, 160);
  const budgetText = request.budget ? `Бюджет: ${request.budget.toLocaleString()} ₽. ` : "";

  return {
    title,
    description: `${budgetText}Автор: ${request.author.name}. ${description}`,
    openGraph: {
      title,
      description: `${budgetText}Автор: ${request.author.name}. ${description}`,
      //url: `https://localhelp.ru/requests/${id}`,
    },
  };
}

export default function RequestLayout({ children }: RequestLayoutProps) {
  return <>{children}</>;
}