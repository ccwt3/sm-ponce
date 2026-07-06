import { CountdownInline } from "./countdown-blocks";
import { BETA_DEADLINE } from "../../lib/landing/constants";

export function UrgencyBar() {
  return (
    <div className="flex w-full max-w-full flex-wrap items-center justify-center gap-2.5 border-b border-black bg-brand-black px-4 py-2 text-center text-[13px] text-brand-white">
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 flex-none animate-pulse rounded-full bg-emerald-400"
      />
      <span>
        <strong className="font-bold">Beta gratuita</strong> por tiempo limitado — solo aceptamos
        pocos negocios
      </span>
      <span
        aria-label="Tiempo restante de la beta"
        className="inline-flex gap-1.5 rounded-md bg-white/10 px-2 py-0.5 font-mono font-bold tracking-wide"
      >
        <CountdownInline deadline={BETA_DEADLINE} />
      </span>
    </div>
  );
}
