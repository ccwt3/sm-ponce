import { getProductTypes, createProductType } from "@/lib/api";
import { useEffect, useState, useCallback } from "react";
import type { ProductType } from "@/types";

export function useProductTypes({
  initialError = null,
}: { initialError?: string | null } = {}) {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [error, setError] = useState<string | null>(initialError);

  const fetchProductTypes = useCallback(async () => {
    try {
      setError(null);
      const types = await getProductTypes();
      setProductTypes(types);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  }, []);

  useEffect(() => {
    fetchProductTypes();
  }, [fetchProductTypes]);

  const handleAddType = async (newType: ProductType) => {
    const createdType = await createProductType(newType.tipo_de_producto);

    setProductTypes((prev) => [...prev, createdType]);
  };

  return { productTypes, error, refetch: fetchProductTypes, handleAddType };
}
