interface ProductSearchStatusProps {
  error: string | null;
  isSearching: boolean;
  isSearchMode: boolean;
  isShowingLocalResults: boolean;
}

export function ProductSearchStatus({
  error,
  isSearching,
  isSearchMode,
  isShowingLocalResults,
}: ProductSearchStatusProps) {
  if (!isSearchMode) {
    return null;
  }

  if (error) {
    return (
      <p aria-live="polite" className="mt-3 text-sm text-brand-danger">
        {error}
      </p>
    );
  }

  if (isSearching) {
    return (
      <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
        {isShowingLocalResults
          ? "Buscando en todo el inventario..."
          : "Cargando mas resultados..."}
      </p>
    );
  }

  return (
    <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
      Resultados de todo el inventario.
    </p>
  );
}
