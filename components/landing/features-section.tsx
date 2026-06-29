import { FEATURES } from "../../lib/landing/features-data";
import { FeatureCard } from "./feature-card";

export function FeaturesSection() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-[88px]">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-9 max-w-[600px]">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-brand-text-muted">
            Todo en un solo lugar
          </p>
          <h2 className="text-[26px] font-extrabold leading-tight tracking-tight sm:text-[32px]">
            Lo que necesita una refaccionaria, nada que no necesite.
          </h2>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
