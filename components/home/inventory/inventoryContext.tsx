import { createContext, useState } from "react";
//TODO PASAR LOS PRODUCTOS, EL ACCIONADOR(botones), Y SABER SI SE QUIERE EDITAR, ELIMINAR O AGREGAR ALGO.
const InventoryContext = createContext(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [modelState, setModelState] = useState({

  })
}