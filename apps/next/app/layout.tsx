import type { Metadata } from "next";
import { DM_Serif_Display } from "next/font/google";
import { Registry } from "./registry";
import { Providers } from "./providers";
import "./global.css";

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kiseki",
  description: "Kiseki – Qui c'est qui ?",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={dmSerifDisplay.variable}>
      <body>
        <Registry>
          <Providers>{children}</Providers>
        </Registry>
      </body>
    </html>
  );
}
