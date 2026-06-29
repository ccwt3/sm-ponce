import { ONBOARDING_STEPS } from "../../lib/landing/onboarding-data";

export function HowItWorksSection() {
  return (
    <section className="bg-brand-surface px-5 py-16 sm:px-8 sm:py-[88px]">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-9 max-w-[600px]">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-brand-text-muted">
            Cómo empiezas
          </p>
          <h2 className="text-[26px] font-extrabold leading-tight tracking-tight sm:text-[32px]">
            Tres pasos y tu catálogo está en línea.
          </h2>
        </div>

        <div className="flex flex-col">
          {ONBOARDING_STEPS.map((step, index) => (
            <div
              key={step.number}
              className={`flex gap-4 py-5 ${
                index < ONBOARDING_STEPS.length - 1 ? "border-b border-brand-border" : ""
              }`}
            >
              <span className="w-7 flex-none pt-0.5 font-mono text-[13px] font-bold text-brand-text-muted">
                {step.number}
              </span>
              <div>
                <h3 className="mb-1 text-[15px] font-bold">{step.title}</h3>
                <p className="max-w-[480px] text-[13.5px] leading-relaxed text-brand-text-secondary">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
