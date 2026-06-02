import { productFormFields } from "@/lib/contentNormalizer";
import type { CreateProductInput } from "@/types";
import { TypeCombobox } from "@/components/inventory/TypeDropdownMenu";
import { inventoryForm } from "@/components/inventory/styles";

const inputModeByKind = {
  decimal: "decimal",
  integer: "numeric",
  text: "text",
} as const;

function fieldContainerClass(field: object) {
  return "span" in field && field.span === "full" ? "col-span-2" : "";
}

export function ProductModalFields({
  handleChange,
  form,
}: {
  handleChange: (
    key: keyof CreateProductInput,
    value: string | number | null,
  ) => void;
  form: CreateProductInput;
}) {
  const inputFields = productFormFields.map((field) => {
    if (field.kind === "productType") {
      return (
        <div
          className={fieldContainerClass(field)}
          key={field.name}
        >
          <label className={inventoryForm.label}>
            {field.label}
          </label>
          <TypeCombobox
            value={String(form[field.name] ?? "")}
            onValueChange={(value) => handleChange(field.name, value)}
          />
        </div>
      );
    }

    return (
      <div
        className={fieldContainerClass(field)}
        key={field.name}
      >
        <label className={inventoryForm.label}>
          {field.label}
        </label>
        <input
          className={inventoryForm.input}
          inputMode={inputModeByKind[field.kind]}
          value={form[field.name] ?? ""}
          onChange={(e) => handleChange(field.name, e.target.value)}
        />
      </div>
    );
  });

  return inputFields;
}
