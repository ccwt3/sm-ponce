"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Settings } from "lucide-react";

import { useLogout } from "@/hooks/useLogout";

export function NavbarMenu() {
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const logout = useLogout();

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Menu de opciones"
        aria-expanded={open}
        className="rounded-md px-2 py-1 text-lg leading-none text-brand-text-secondary transition-colors hover:bg-brand-surface"
      >
        ...
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 top-9 z-50 min-w-[160px] overflow-hidden rounded-md border border-brand-border bg-white shadow-dropdown">
          <button
            onClick={() => {
              setOpen(false);
              console.log("-> ir a configuracion");
            }}
            className="flex w-full items-center gap-2.5 border-b border-brand-border px-4 py-2.5 text-left text-sm text-brand-text-primary transition-colors hover:bg-brand-surface"
          >
            <Settings size={14} strokeWidth={1.75} />
            Configuracion
          </button>
          <button
            onClick={async () => {
              setLogoutError(null);
              setIsLoggingOut(true);

              try {
                await logout();
                setOpen(false);
              } catch (error) {
                setLogoutError(
                  error instanceof Error
                    ? error.message
                    : "Error al cerrar sesion",
                );
              } finally {
                setIsLoggingOut(false);
              }
            }}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-brand-danger transition-colors hover:bg-brand-danger-hover-bg"
          >
            <LogOut size={14} strokeWidth={1.75} />
            {isLoggingOut ? "Cerrando..." : "Cerrar sesion"}
          </button>
          {logoutError && (
            <p className="border-t border-brand-border px-4 py-2 text-xs text-brand-danger">
              {logoutError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
