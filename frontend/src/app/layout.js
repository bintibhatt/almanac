import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const themeScript = `
(function () {
  try {
    var storageKey = "almanac-theme";
    var storedTheme = window.localStorage.getItem(storageKey);
    var theme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";
    var root = document.documentElement;
    var themeColor = theme === "light" ? "#fafafa" : "#09090b";

    root.classList.toggle("light", theme === "light");
    root.dataset.theme = theme;

    var metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", themeColor);
    }
  } catch (error) {}
})();
`;

export const metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "Almanac — Autonomous Engineering Knowledge Base",
    template: "%s | Almanac",
  },
  description: "High-signal production engineering guides, system design patterns, dense vector search, and interactive AI learning.",
  manifest: "/manifest.webmanifest",
  applicationName: "Almanac",
  appleWebApp: {
    capable: true,
    title: "Almanac",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icons/almanac-icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full scroll-smooth antialiased"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-[#09090b] text-[#f4f4f5]">
        <ServiceWorkerRegister />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
