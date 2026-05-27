import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://local-help-pam0sblod-killerka769s-projects-11fdba53.vercel.app";

  const requests = await prisma.request.findMany({
    where: { status: "active" },
    select: { id: true, updatedAt: true },
    take: 100,
  });

  const users = await prisma.user.findMany({
    select: { id: true, updatedAt: true },
    take: 100,
  });

  const staticPages = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/feed", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/how-it-works", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.5, changeFrequency: "yearly" as const },
  ];

  const requestPages = requests.map((req) => ({
    url: `${baseUrl}/requests/${req.id}`,
    lastModified: req.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const userPages = users.map((user) => ({
    url: `${baseUrl}/users/${user.id}`,
    lastModified: user.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const staticUrls = staticPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  return [...staticUrls, ...requestPages, ...userPages];
}