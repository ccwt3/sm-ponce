import ClientAhhFooter from "./client-ahh-footer";
import { Suspense } from "react";

const FOOTER_LINKS = [
  { label: "Terminos", href: "/terms.html" },
  { label: "Privacidad", href: "/privacy.html" },
  { label: "contacto@reicot.dev", href: "#" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-brand-border px-5 py-7 sm:px-8">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-3.5 text-[12.5px] text-brand-text-muted sm:flex-row sm:items-center sm:justify-between">
        <Suspense fallback={<span>Loading...</span>}>
          <ClientAhhFooter />
        </Suspense>

        <div className="flex gap-4">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-brand-text-secondary transition-colors hover:text-brand-text-primary"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
