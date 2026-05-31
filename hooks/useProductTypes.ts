import { getProductTypes, createProductType } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import type { ProductType } from "@/types";

export function useProductTypes({
  initialError = null,
}: { initialError?: string | null } = {}) {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [error, setError] = useState<string | null>(initialError);
  const [creating, setCreating] = useState(false);

  const fetchProductTypes = useCallback(async () => {
    try {
      setError(null);
      const types = await getProductTypes();
      setProductTypes(types);
      return types;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      return [];
    }
  }, []);

  useEffect(() => {
    fetchProductTypes();
  }, [fetchProductTypes]);

  const handleAddType = async (typeName: string) => {
    try {
      setCreating(true);
      setError(null);
      const createdType = await createProductType(typeName);

      setProductTypes((prev) => {
        if (prev.some((type) => type.id === createdType.id)) {
          return prev;
        }

        return [...prev, createdType];
      });

      return createdType;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear tipo");
      throw err;
    } finally {
      setCreating(false);
    }
  };

  return {
    productTypes,
    error,
    creating,
    refetch: fetchProductTypes,
    handleAddType,
  };
}
