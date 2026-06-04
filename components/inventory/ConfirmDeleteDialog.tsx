"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteEntityLabel = "producto" | "tipo";

interface ConfirmDeleteDialogProps {
  open: boolean;
  entityLabel: DeleteEntityLabel;
  itemName: string;
  isDeleting?: boolean;
  errorMessage?: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
}

export function ConfirmDeleteDialog({
  open,
  entityLabel,
  itemName,
  isDeleting = false,
  errorMessage = null,
  onOpenChange,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const trimmedItemName = itemName.trim();
  const targetLabel = trimmedItemName
    ? `el ${entityLabel} "${trimmedItemName}"`
    : `este ${entityLabel}`;

  const handleOpenChange = (nextOpen: boolean) => {
    if (isDeleting) {
      return;
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!isDeleting}>
        <DialogHeader>
          <DialogTitle>Eliminar {entityLabel}</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de eliminar {targetLabel}? Esta acción no se puede
            deshacer.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {errorMessage}
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
