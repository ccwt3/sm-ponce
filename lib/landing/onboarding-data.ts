export interface OnboardingStep {
  number: string;
  title: string;
  description: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    number: "01",
    title: "Crea tu cuenta",
    description: "Entra con tu correo, sin instalar nada ni configurar servidores.",
  },
  {
    number: "02",
    title: "Carga tus piezas",
    description:
      "Agrega cada producto con su modelo, medida, existencia y precios — uno por uno o por lotes.",
  },
  {
    number: "03",
    title: "Vende con el inventario al día",
    description:
      "Edita existencias al momento de vender y siempre sabe qué hay realmente en el anaquel.",
  },
];
