import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

/** Rounded, friendly fintech type from the mobile design samples. */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

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
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
