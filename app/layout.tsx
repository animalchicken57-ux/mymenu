import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";

import { dir, resolveLang } from "@/lib/i18n";
import "./globals.css";

/**
 * One family across Arabic and Latin. DESIGN.md § Typography: a single family
 * is what keeps an Arabic screen and an English screen feeling like the same
 * product.
 */
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyMenu — your restaurant's own ordering page",
  description:
    "Take orders on your own page and stop paying commission on customers who already know you.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // AD-10: direction is an attribute set once here, not a second stylesheet.
  const lang = await resolveLang();

  return (
    <html
      lang={lang}
      dir={dir(lang)}
      className={`${plexArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
