import type { LucideIcon } from "lucide-react";
import { LayoutGrid, ArrowUpDown, Search, ShieldAlert, Rows3, Store } from "lucide-react";

export interface Feature {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FEATURES: Feature[] = [
  {
    id: "ficha-completa",
    icon: LayoutGrid,
    title: "Ficha completa por pieza",
    description: "Modelo, medida, tipo y descripción en un solo registro, fácil de buscar y editar.",
  },
  {
    id: "precios",
    icon: ArrowUpDown,
    title: "Precio proveedor y público",
    description:
      "Captura ambos precios y conoce tu margen real en cada venta, sin calculadora aparte.",
  },
  {
    id: "busqueda",
    icon: Search,
    title: "Búsqueda al instante",
    description:
      "Encuentra cualquier pieza por nombre, modelo o medida mientras el cliente espera en el mostrador.",
  },
  {
    id: "alertas",
    icon: ShieldAlert,
    title: "Alertas de existencia",
    description:
      "Las piezas bajas o agotadas se distinguen solas, antes de que se conviertan en una venta perdida.",
  },
  {
    id: "crud",
    icon: Rows3,
    title: "CRUD completo",
    description: "Agrega, edita y borra piezas del catálogo en segundos, desde cualquier dispositivo.",
  },
  {
    id: "mostrador",
    icon: Store,
    title: "Pensado para el mostrador",
    description:
      "Pantallas simples, sin curva de aprendizaje, para que cualquiera en el negocio lo use desde el primer día.",
  },
];
