import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next"
import { PostHogAuthIdentifier } from "@/components/posthog-auth-identifier";
import "./globals.css";

export const metadata: Metadata = {
  title: "Motorefacciones — Inventario",
  description: "Sistema de gestión de inventario",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans">
        {children}

        <PostHogAuthIdentifier />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
