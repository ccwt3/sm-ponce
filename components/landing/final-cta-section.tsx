import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BETA_DEADLINE, SIGNUP_PATH } from "@/lib/landing/constants";
import { CountdownBlocks } from "./countdown-blocks";

export function FinalCtaSection() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-[88px]">
      <div className="mx-auto max-w-[1120px]">
        <div
          className="relative overflow-hidden rounded-[20px] bg-brand-black px-6 py-11 text-center sm:px-10 sm:py-16"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
            backgroundSize: "16px 16px",
          }}
        >
          <div className="relative">
            <h2 className="mx-auto mb-3 max-w-[440px] text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-[34px]">
              Entra a la beta gratuita antes de que se acaben los cupos.
            </h2>
            <p className="mx-auto mb-6 max-w-[380px] text-sm leading-relaxed text-[#B5B5B5]">
              Estamos aceptando solo un grupo pequeño de refaccionarias mientras afinamos la
              plataforma con uso real.
            </p>

            <Link
              href={SIGNUP_PATH}
              className="inline-flex items-center gap-2 rounded-[9px] bg-white px-5 py-3.5 text-[15px] font-bold text-brand-black transition-colors hover:bg-[#e8e8e8] active:scale-[0.98]"
            >
              Crear mi cuenta gratis
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Link>

            <div className="mt-6 inline-flex gap-2.5">
              <CountdownBlocks
                deadline={BETA_DEADLINE}
                unitClassName="min-w-[58px] rounded-[9px] border border-white/10 bg-white/[0.08] px-3.5 py-2.5"
                numberClassName="block font-mono text-xl font-bold text-white"
                labelClassName="text-[9.5px] uppercase tracking-wide text-[#999]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
