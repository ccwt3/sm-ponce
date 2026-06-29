import type { Feature } from "../../lib/landing/features-data";

interface FeatureCardProps {
  feature: Feature;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = feature.icon;

  return (
    <div className="rounded-[13px] border border-brand-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#cfcfcf]">
      <span className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-black">
        <Icon className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
      </span>
      <h3 className="mb-1.5 text-[15.5px] font-bold tracking-tight">{feature.title}</h3>
      <p className="text-[13.5px] leading-relaxed text-brand-text-secondary">
        {feature.description}
      </p>
    </div>
  );
}
