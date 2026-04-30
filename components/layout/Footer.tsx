export function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-brand-border bg-brand-surface px-6 py-4">
      <span className="text-xs text-brand-text-muted">
        © 2026 Motorefacciones — Todos los derechos reservados
      </span>
      <nav className="flex gap-4">
        {["Soporte", "Privacidad", "Contacto"].map((link) => (
          <a
            key={link}
            href="#"
            className="text-xs text-brand-text-muted hover:text-brand-text-secondary transition-colors"
          >
            {link}
          </a>
        ))}
      </nav>
    </footer>
  );
}
