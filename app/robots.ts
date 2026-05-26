import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/admin", "/profile/edit"],
    },
    //sitemap: "https://localhelp.ru/sitemap.xml",
  };
}