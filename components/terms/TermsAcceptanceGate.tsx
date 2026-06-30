"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PRIVACY_URL, TERMS_URL } from "@/lib/terms";

/**
 * Popup no-descartable que bloquea el uso de la aplicacion hasta que el usuario
 * acepta la version vigente de los terminos.
 *
 * El servidor decide cuando renderizar este gate (en `/home`, cuando el dominio
 * lanza `TermsRequiredError`). Aunque alguien fuerce el cierre del dialog desde
 * el navegador, el gate server-side y la API siguen bloqueando todo acceso a
 * datos: este componente es solo la via para registrar la aceptacion.
 */
export function TermsAcceptanceGate() {
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!accepted) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/terms/accept", { method: "POST" });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "No se pudo registrar la aceptacion");
      }

      // Recargar para que el servidor reevalue el gate y muestre la aplicacion.
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrio un error");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 p-6">
      <p className="py-12 text-center text-sm text-brand-text-muted">
        Para continuar necesitas aceptar los terminos y condiciones.
      </p>

      <Dialog open>
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Terminos y condiciones</DialogTitle>
            <DialogDescription>
              Para seguir usando la aplicacion debes aceptar la version vigente
              de los terminos.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-start gap-2">
            <input
              id="accept-terms"
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-1"
            />
            <Label
              htmlFor="accept-terms"
              className="text-sm font-normal leading-snug"
            >
              He leido y acepto los{" "}
              <a
                href={TERMS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                Terminos de Servicio
              </a>{" "}
              y el{" "}
              <a
                href={PRIVACY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                Aviso de Privacidad
              </a>
              .
            </Label>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <DialogFooter>
            <Button onClick={handleAccept} disabled={!accepted || isSubmitting}>
              {isSubmitting ? "Guardando..." : "Aceptar y continuar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
