"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { LOGIN_PATH, BETA_DEADLINE } from "../../lib/landing/constants";
import { CountdownBlocks } from "./countdown-blocks";

const OPEN_DELAY_MS = 600;

export function BetaModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) setIsOpen(false);
      }}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm transition-opacity duration-200 ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        className={`relative w-full max-w-[400px] rounded-2xl bg-white p-6 pt-6 shadow-[0_24px_60px_-10px_rgba(0,0,0,0.35)] transition-all duration-200 ${
          isOpen ? "scale-100 translate-y-0 opacity-100" : "scale-[0.96] translate-y-1.5 opacity-0"
        }`}
      >
        <button
          type="button"
          aria-label="Cerrar"
          onClick={() => setIsOpen(false)}
          className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-md text-brand-text-muted transition-colors hover:bg-brand-surface hover:text-brand-text-primary"
        >
          <X className="h-[15px] w-[15px]" strokeWidth={2.3} />
        </button>

        <span className="mb-3.5 inline-flex items-center gap-1.5 rounded-full bg-brand-stock-low-bg px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wide text-brand-stock-low-text">
          Beta limitada
        </span>

        <h2 id="beta-modal-title" className="mb-2 text-[19px] font-extrabold leading-tight tracking-tight">
          Beta gratuita por tiempo limitado
        </h2>

        <p className="mb-4 text-[13.5px] leading-relaxed text-brand-text-secondary">
          Estamos aceptando solo a un grupo pequeño de refaccionarias para esta primera etapa.
          Cuando se cierren los cupos o se acabe el tiempo, la siguiente entrada será con plan de
          pago.
        </p>

        <div className="mb-4 flex gap-2">
          <CountdownBlocks
            deadline={BETA_DEADLINE}
            unitClassName="flex-1 rounded-[9px] border border-brand-border bg-brand-surface px-1.5 py-2.5 text-center"
            numberClassName="block font-mono text-[19px] font-extrabold text-brand-text-primary"
            labelClassName="text-[9px] uppercase tracking-wide text-brand-text-muted"
          />
        </div>

        <Link
          href={LOGIN_PATH}
          className="flex w-full items-center justify-center gap-2 rounded-[9px] bg-brand-black px-5 py-3.5 text-[15px] font-bold text-brand-white transition-colors hover:bg-brand-black-hover active:scale-[0.98]"
        >
          Asegurar mi lugar gratis
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </Link>

        <p className="mt-3 text-center text-[11.5px] text-brand-text-muted">
          Sin tarjeta. Cancela cuando quieras.
        </p>
      </div>
    </div>
  );
}
