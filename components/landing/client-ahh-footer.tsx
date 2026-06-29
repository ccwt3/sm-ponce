"use client";
import { SITE_NAME } from "../../lib/landing/constants";

export default function ClientAhhFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <span>
      © {currentYear} {SITE_NAME} — Todos los derechos reservados
    </span>
  );
}
