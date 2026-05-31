export const inventoryForm = {
  label: "mb-1 block text-xs text-brand-text-secondary",
  input:
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
};

export const inventoryButton = {
  primary:
    "rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50",
  modalPrimary:
    "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50",
  secondary:
    "rounded-md border border-input bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
  table:
    "rounded border border-input px-3 py-1 text-xs text-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
  dangerTable:
    "rounded border border-brand-danger-border px-3 py-1 text-xs text-brand-danger transition-colors hover:bg-brand-danger-hover-bg",
};

export const inventoryTable = {
  heading: "px-3 py-2.5 text-left text-xs font-normal text-muted-foreground",
  row: "border-b border-border transition-colors last:border-0 hover:bg-accent",
  cell: "px-3 py-3.5",
  cellPrimary: "px-3 py-3.5 text-foreground",
  cellSecondary: "px-3 py-3.5 text-muted-foreground",
  cellEmphasis: "px-3 py-3.5 font-medium text-foreground",
};

export const inventoryState = {
  empty: "py-16 text-center text-sm text-muted-foreground",
  loading: "py-12 text-center text-sm text-muted-foreground",
  error: "py-12 text-center text-sm text-brand-danger",
};
