import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Athar Habits & Symptoms",
    short_name: "Athar Habits",
    description: "Comprends ton énergie, anticipe tes baisses.",
    start_url: "/",
    display: "standalone",
    background_color: "#10102b",
    theme_color: "#10102b",
    icons: [
      {
        src: "/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
