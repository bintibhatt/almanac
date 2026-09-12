export default function manifest() {
  return {
    name: "Almanac",
    short_name: "Almanac",
    description: "A living engineering library for focused technical reading.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0f14",
    theme_color: "#0b0f14",
    categories: ["education", "productivity", "books"],
    icons: [
      {
        src: "/icons/almanac-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/almanac-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
