import type { Metadata } from "next";
import { DM_Serif_Display } from "next/font/google";
import { Registry } from "./registry";
import { Providers } from "./providers";
import { WebGlassDefs } from "./web-glass-defs";
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
          <Providers>
            <WebGlassDefs />
            <div className="web-fixed-bg-image" aria-hidden />
            <div className="web-app-layer">{children}</div>
          </Providers>
        </Registry>
      </body>
    </html>
  );
}
