import type { MetadataRoute } from "next";

const applicationUrl = process.env.APP_URL?.trim() || "https://sigerkan.ubl.ac.id";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/"],
    },
    sitemap: new URL("/sitemap.xml", applicationUrl).toString(),
    host: applicationUrl,
  };
}
