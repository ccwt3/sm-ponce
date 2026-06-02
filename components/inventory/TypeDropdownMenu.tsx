"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { useProductTypes } from "@/hooks/useProductTypes";
import type { ProductType } from "@/types";
import { deleteProductType } from "@/lib/api";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TypeComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function TypeCombobox({ value = "", onValueChange }: TypeComboboxProps) {
  const { productTypes, error, creating, handleAddType } = useProductTypes();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const selectedType = productTypes.find(
    (type) => type.id === value || type.tipo_de_producto === value,
  );

  const selectedLabel =
    selectedType?.tipo_de_producto || value || "Selecciona un tipo";

  const filteredTypes = productTypes.filter((type) =>
    type.tipo_de_producto.toLowerCase().includes(normalizedSearch),
  );

  const exactMatch = productTypes.some(
    (type) => type.tipo_de_producto.trim().toLowerCase() === normalizedSearch,
  );

  const canAddNewType = search.trim().length > 0 && !exactMatch;

  function selectType(type: ProductType) {
    onValueChange?.(type.tipo_de_producto);
    setSearch("");
    setOpen(false);
  }

  async function addNewType() {
    const newType = search.trim();

    if (!newType) return;

    const existingType = productTypes.find(
      (type) => type.tipo_de_producto.toLowerCase() === newType.toLowerCase(),
    );

    if (existingType) {
      selectType(existingType);
      return;
    }

    try {
      const createdType = await handleAddType(newType);
      selectType(createdType);
    } catch {
      // The hook exposes the user-facing error message.
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          role="combobox"
          className="w-full justify-between bg-background px-3 font-normal text-foreground hover:bg-accent hover:text-accent-foreground"
          aria-expanded={open}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar tipo..."
            value={search}
            onValueChange={setSearch}
          />

          <CommandList>
            <CommandGroup>
              {filteredTypes.map((type) => (
                <CommandItem
                  key={type.id}
                  value={type.tipo_de_producto}
                  onSelect={() => {
                    selectType(type);
                  }}
                  className="group flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedType?.id === type.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {type.tipo_de_producto}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // evita que active onSelect
                      deleteProductType(type.id); // tu lógica aquí
                    }}
                    className="invisible group-hover:visible rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </CommandItem>
              ))}
            </CommandGroup>

            {canAddNewType && (
              <CommandGroup>
                <CommandItem
                  value={`add-${search}`}
                  onSelect={addNewType}
                  disabled={creating}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {creating ? "Agregando..." : `Agregar "${search.trim()}"`}
                </CommandItem>
              </CommandGroup>
            )}

            {search.trim() && filteredTypes.length === 0 && !canAddNewType && (
              <CommandEmpty>No se encontraron tipos.</CommandEmpty>
            )}

            {error && (
              <p className="px-3 py-2 text-xs text-brand-danger">{error}</p>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
