export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    id: "costo",
    question: "¿Esto tiene algún costo?",
    answer:
      "No. Durante la beta es completamente gratis. Cuando la beta cierre, notificaremos con tiempo antes de cualquier cambio.",
  },
  {
    id: "instalacion",
    question: "¿Necesito instalar algo?",
    answer:
      "No. Entra con tu correo desde cualquier dispositivo — computadora, tablet o celular.",
  },
  {
    id: "seguridad",
    question: "¿Mis datos están seguros?",
    answer: "Sí. Tu inventario es privado y solo tú puedes verlo. Nadie más tiene acceso.",
  },
  {
    id: "pago",
    question: "¿Cuándo se vuelve de pago?",
    answer:
      "Aún no definimos fecha. Los usuarios de beta serán los primeros en saber y tendrán condiciones especiales.",
  },
];
