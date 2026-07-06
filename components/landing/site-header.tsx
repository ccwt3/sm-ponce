import Link from "next/link";
import { Wrench, ArrowRight } from "lucide-react";
import {
  LOGIN_PATH,
  SIGNUP_PATH,
  SITE_NAME,
} from "../../lib/landing/constants";

export function SiteHeader() {
  return (
    <header className="border-b border-brand-border bg-white/90 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-3 gap-y-2.5 px-4 py-3 sm:px-8 sm:py-3.5">
        <div className="flex min-w-0 items-center gap-2.5 text-base font-extrabold tracking-tight">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-brand-black">
            <Wrench
              className="h-[15px] w-[15px] text-white"
              strokeWidth={2.2}
            />
          </span>
          {SITE_NAME}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href={LOGIN_PATH}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-transparent px-3 py-2 text-[13.5px] font-semibold text-brand-black transition-colors hover:bg-brand-surface sm:px-4"
          >
            Iniciar sesion
          </Link>

          <Link
            href={SIGNUP_PATH}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-brand-black px-3 py-2 text-[13.5px] font-semibold text-brand-white transition-colors hover:bg-brand-black-hover sm:px-4"
          >
            Crear cuenta
            <ArrowRight className="h-[13px] w-[13px]" strokeWidth={2.5} />
          </Link>
        </div>
      </nav>
    </header>
  );
}
