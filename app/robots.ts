import { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/jwt";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl();

  if (!siteUrl) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/settings", "/profile/edit"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
