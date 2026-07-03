import type { Metadata } from "next";
import { UrgencyBar } from "../components/landing/urgency-bar";
import { SiteHeader } from "../components/landing/site-header";
import { HeroSection } from "../components/landing/hero-section";
import { StockStatesSection } from "../components/landing/stock-states-section";
import { FeaturesSection } from "../components/landing/features-section";
import { HowItWorksSection } from "../components/landing/how-it-works-section";
import { FinalCtaSection } from "../components/landing/final-cta-section";
import { FaqSection } from "../components/landing/faq-section";
import { SiteFooter } from "../components/landing/site-footer";
import { BetaModal } from "../components/landing/beta-modal";

export const metadata: Metadata = {
  title: "Motorefacciones — Inventario para refaccionarias",
  description:
    "Gestiona el inventario de tu refaccionaria: modelo, medida, existencia y precios de cada pieza, en un solo lugar.",
};

export default function LandingPage() {
  return (
    <>
      <UrgencyBar />
      <SiteHeader />

      <main>
        <HeroSection />
        <StockStatesSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FaqSection />
        <FinalCtaSection />
      </main>

      <SiteFooter />
      <BetaModal />
    </>
  );
}
