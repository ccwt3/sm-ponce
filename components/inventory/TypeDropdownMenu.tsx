"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useProductTypes } from "@/hooks/useProductTypes";

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

export function TypeCombobox({ handleChange }: { handleChange?: (value: string) => void }) {
  const { productTypes, handleAddType, refetch } = useProductTypes();

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");

  const filteredTypes = productTypes.filter((type) =>
    type.tipo_de_producto.toLowerCase().includes(search.toLowerCase()),
  );

  function addNewType() {
    const newType = search.trim();

    if (!newType) return;
    if (
      productTypes.some(
        (type) => type.tipo_de_producto.toLowerCase() === newType.toLowerCase(),
      )
    ) {
      return;
    }

    handleAddType({ id: "", tipo_de_producto: newType });
    refetch(); // Refrescar la lista de tipos después de agregar uno nuevo
    handleChange?.(newType);
    setValue(newType);
    setSearch("");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="default"
          role="combobox"
          className="w-full justify-between"
          id = {productTypes.find(type => type.tipo_de_producto === value)?.id}
        >
          {value || "Selecciona un tipo"}
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
                    setValue(type.tipo_de_producto);
                    handleChange?.(type.tipo_de_producto);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === type.tipo_de_producto
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {type.tipo_de_producto}
                </CommandItem>
              ))}
            </CommandGroup>

            {search.trim() && filteredTypes.length === 0 && (
              <CommandEmpty>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={addNewType}
                >
                  <Plus className="h-4 w-4" />
                  Agregar "{search}"
                </Button>
              </CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
