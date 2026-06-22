import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "MyBenefitsPA",
  description: "Compare bank activity to benefit-program thresholds and get calm email reminders before limits.",
  icons: {
    icon: "/mybenefitspa-icon.png",
    shortcut: "/mybenefitspa-icon.png",
    apple: "/mybenefitspa-icon.png",
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
