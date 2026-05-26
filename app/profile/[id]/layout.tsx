import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface UserLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: UserLayoutProps): Promise<Metadata> {
  const { id } = await params;
  
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, description: true },
  });

  if (!user) {
    return {
      title: "Пользователь не найден",
    };
  }

  const title = `${user.name}`;
  const description = user.description?.slice(0, 160) || `Пользователь Local Help`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://localhelp.ru/profile/${id}`,
    },
  };
}

export default function UserLayout({ children }: UserLayoutProps) {
  return <>{children}</>;
}