import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://lottoinsight.kr";

  const staticPages = [
    "",
    "/login",
    "/signup",
    "/pricing",
    "/my-lotto",
    "/admin",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
  }));

  const roundPages = Array.from({ length: 1200 }, (_, i) => {
    const round = i + 1;
    return {
      url: `${baseUrl}/lotto/${round}`,
      lastModified: new Date(),
    };
  });

  const numberPages = Array.from({ length: 45 }, (_, i) => {
    const num = i + 1;
    return {
      url: `${baseUrl}/numbers/${num}`,
      lastModified: new Date(),
    };
  });

  return [...staticPages, ...roundPages, ...numberPages];
}