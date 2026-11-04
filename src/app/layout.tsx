import type { Metadata, Viewport } from "next";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-ext-400.css";
import "@fontsource/inter/latin-ext-500.css";
import "@fontsource/inter/latin-ext-600.css";
import "@fontsource/inter/cyrillic-400.css";
import "@fontsource/inter/cyrillic-500.css";
import "@fontsource/inter/cyrillic-600.css";
import "@fontsource/inter/cyrillic-ext-400.css";
import "@fontsource/inter/cyrillic-ext-500.css";
import "@fontsource/inter/cyrillic-ext-600.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import "@fontsource/manrope/cyrillic-600.css";
import "@fontsource/manrope/cyrillic-700.css";
import "@fontsource/manrope/cyrillic-800.css";
import "@fontsource/manrope/cyrillic-ext-600.css";
import "@fontsource/manrope/cyrillic-ext-700.css";
import "@fontsource/manrope/cyrillic-ext-800.css";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: { default: "Vrooma · Автомашины зах зээл", template: "%s · Vrooma" },
  description: "Vrooma: Монголын найдвартай автомашины зах зээл. Машин худалдах, худалдан авах, харьцуулах, лизингийн тооцоо.",
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0B0B0D" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded-full">Skip</a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
