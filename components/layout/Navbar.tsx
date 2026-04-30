"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, LogOut } from "lucide-react";

interface NavbarProps {
  onSettings?: () => void;
  onLogout?: () => void;
}

export function Navbar({ onSettings, onLogout }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="flex items-center justify-between border-b border-brand-border px-6 py-4">
      <span className="text-[17px] font-medium text-brand-text-primary">
        Motorefacciones
      </span>

      {/* Menú de tres puntos */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Menú de opciones"
          aria-expanded={open}
          className="rounded-md px-2 py-1 text-lg leading-none text-brand-text-secondary hover:bg-brand-surface transition-colors"
        >
          ···
        </button>

        {open && (
          <div className="animate-fade-in absolute right-0 top-9 z-50 min-w-[160px] overflow-hidden rounded-md border border-brand-border bg-white shadow-dropdown">
            <button
              onClick={() => { setOpen(false); onSettings?.(); }}
              className="flex w-full items-center gap-2.5 border-b border-brand-border px-4 py-2.5 text-left text-sm text-brand-text-primary hover:bg-brand-surface transition-colors"
            >
              <Settings size={14} strokeWidth={1.75} />
              Configuración
            </button>
            <button
              onClick={() => { setOpen(false); onLogout?.(); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-brand-danger hover:bg-brand-danger-hover-bg transition-colors"
            >
              <LogOut size={14} strokeWidth={1.75} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
