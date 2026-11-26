import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const staticPages = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/feed", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/how-it-works", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/faq", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.4, changeFrequency: "yearly" as const },
    { path: "/privacy", priority: 0.4, changeFrequency: "yearly" as const },
  ];

  const staticUrls = staticPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  let requestPages: MetadataRoute.Sitemap = [];
  try {
    const requests = await prisma.request.findMany({
      where: { status: "active", expiresAt: { gt: new Date() } },
      select: { id: true, updatedAt: true },
      take: 100,
    });
    requestPages = requests.map((req) => ({
      url: `${baseUrl}/requests/${req.id}`,
      lastModified: req.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("[sitemap]", error);
  }

  return [...staticUrls, ...requestPages];
}
