import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LOGIN_PATH, SHOWCASE_ANCHOR_ID } from "../../lib/landing/constants";
import { InventoryShowcase } from "./inventory-showcase";

export function HeroSection() {
  return (
    <section className="relative px-5 py-12 sm:px-8 sm:py-[72px] sm:pb-14">
      <div
        aria-hidden="true"
        className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.035) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-[12.5px] font-bold uppercase tracking-wide text-brand-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-stock-ok-text" />
            Hecho para refaccionarias
          </span>

          <h1 className="max-w-[680px] text-[34px] font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[56px]">
            Tu inventario,{" "}
            <em className="border-b-[5px] border-brand-stock-low-bg font-black not-italic">
              sin adivinar
            </em>{" "}
            qué tienes en el anaquel.
          </h1>

          <p className="mt-4 max-w-[520px] text-base leading-relaxed text-brand-text-secondary sm:text-[17.5px]">
            Registra modelo, medida, existencia y precios de cada pieza. Sabe en segundos qué se
            está agotando, qué ganancia deja cada venta y qué buscar cuando llega el cliente.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={LOGIN_PATH}
              className="inline-flex items-center gap-2 rounded-[9px] bg-brand-black px-5 py-3.5 text-[15px] font-bold text-brand-white transition-colors hover:bg-brand-black-hover active:scale-[0.98]"
            >
              Empezar gratis
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Link>
            <a
              href={`#${SHOWCASE_ANCHOR_ID}`}
              className="inline-flex items-center gap-2 rounded-[9px] border-[1.5px] border-brand-border px-5 py-3.5 text-[15px] font-semibold text-brand-text-primary transition-colors hover:border-brand-black hover:bg-brand-surface"
            >
              Ver cómo funciona
            </a>
          </div>

          <div className="mt-5 flex items-center gap-2.5 text-[13px] text-brand-text-muted">
            <div className="flex">
              {["RM", "JL", "AC"].map((initials) => (
                <span
                  key={initials}
                  className="-ml-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand-black text-[9px] font-bold text-white first:ml-0"
                >
                  {initials}
                </span>
              ))}
            </div>
            <span>Cupos limitados de la beta — primeras refaccionarias en entrar</span>
          </div>
        </div>

        <InventoryShowcase />
      </div>
    </section>
  );
}
