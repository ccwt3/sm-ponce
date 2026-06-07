import { inventoryButton } from "@/components/inventory/styles";

interface ProductPaginationProps {
  ariaLabel?: string;
  hasNextPage: boolean;
  loading: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  page: number;
}

export function ProductPagination({
  ariaLabel = "Paginacion de productos",
  hasNextPage,
  loading,
  onNextPage,
  onPreviousPage,
  page,
}: ProductPaginationProps) {
  if (page === 0 && !hasNextPage) {
    return null;
  }

  return (
    <nav
      aria-label={ariaLabel}
      className="mt-5 flex items-center justify-end gap-3"
    >
      <button
        type="button"
        onClick={onPreviousPage}
        disabled={loading || page === 0}
        className={inventoryButton.secondary}
      >
        Anterior
      </button>
      <span className="text-sm text-muted-foreground">
        Pagina {page + 1}
      </span>
      <button
        type="button"
        onClick={onNextPage}
        disabled={loading || !hasNextPage}
        className={inventoryButton.secondary}
      >
        Siguiente
      </button>
    </nav>
  );
}
