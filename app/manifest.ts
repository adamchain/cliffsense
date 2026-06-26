import type { MetadataRoute } from "next";

/**
 * PWA manifest. Makes the app installable on Android/desktop and lets push
 * notifications work from the browser. `display: standalone` runs the installed
 * app chromeless so notifications behave like a native app.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyBenefitsPA",
    short_name: "MyBenefitsPA",
    description:
      "Track benefit thresholds, get alerts before you cross an eligibility limit, and stay on top of your benefits.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f0f2f7",
    theme_color: "#4b63f0",
    icons: [
      { src: "/mybenefitspa-icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/mybenefitspa-icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/mybenefitspa-icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
