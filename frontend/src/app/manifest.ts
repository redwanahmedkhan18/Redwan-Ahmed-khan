import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Redwan Ahmed Khan — AI Engineer | Software Engineer | Researcher",
    short_name: "Redwan Ahmed Khan",
    description:
      "Portfolio of Redwan Ahmed Khan: production AI engineering, software engineering and AI/ML research.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0c10",
    theme_color: "#0a0c10",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
