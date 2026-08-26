import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "https://dtmn-eta.vercel.app";

  const staticRoutes = [
    "",
    "/about",
    "/academics/nursery",
    "/academics/primary",
    "/academics/high-school",
    "/academics/college",
    "/faculty",
    "/facilities",
    "/events",
    "/circulars",
    "/activities",
    "/gallery",
    "/admissions",
    "/contact",
  ];

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: (route === "" ? "daily" : "weekly") as "daily" | "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
