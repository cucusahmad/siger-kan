import type { MetadataRoute } from "next";

const applicationUrl = process.env.APP_URL?.trim() || "https://sigerkan.ubl.ac.id";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: new URL("/", applicationUrl).toString(),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
