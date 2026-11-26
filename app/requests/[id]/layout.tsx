import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/jwt";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const base = getSiteUrl();
  const request = await prisma.request.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      address: true,
      city: { select: { name: true } },
    },
  });

  if (!request) {
    return { title: "Заявка" };
  }

  const loc = [request.city?.name, request.address].filter(Boolean).join(", ");
  const description = `${loc}. ${request.description}`.slice(0, 180);

  return {
    title: request.title,
    description,
    openGraph: {
      title: request.title,
      description,
      url: `${base}/requests/${id}`,
      locale: "ru_RU",
      type: "article",
      siteName: "Local Help",
    },
  };
}

export default function RequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
