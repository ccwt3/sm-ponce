import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Motorefacciones — Inventario",
  description: "Sistema de gestión de inventario",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans">{children}</body>
    </html>
  );
}
