import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CliffSense",
  description: "Compare bank activity to benefit-program thresholds and get calm email reminders before limits.",
  icons: {
    icon: "/cliffsense-icon.png",
    shortcut: "/cliffsense-icon.png",
    apple: "/cliffsense-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
