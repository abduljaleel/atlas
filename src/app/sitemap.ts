import type { MetadataRoute } from "next";

const SITE_URL = "https://atlas-akventurecorp.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: "https://abduljaleel.xyz/aletheia", lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];
}
