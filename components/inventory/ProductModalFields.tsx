import { databaseFields } from "@/lib/contentNormalizer";
import type { CreateProductInput } from "@/types";
import { TypeCombobox } from "@/components/inventory/TypeDropdownMenu";
import { inventoryForm } from "@/components/inventory/styles";

// Se renderizan los campos del formulario
// No tiene logica mas alla del formulario en si.
export function ProductModalFields({
  handleChange,
  form,
}: {
  handleChange: (key: keyof CreateProductInput, value: string | number) => void;
  form: CreateProductInput;
}) {
  const inputFields = databaseFields.map((field, i) => {
    if (field.name === "tipo_id") {
      return (
        <div className={i === 0 ? "col-span-2" : ""} key={field.name}>
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
      <div className={i === 0 ? "col-span-2" : ""} key={field.name}>
        <label className={inventoryForm.label}>
          {field.label}
        </label>
        <input
          className={inventoryForm.input}
          inputMode={field.type === 2 || field.type === 3 ? "decimal" : "text"}
          value={form[field.name] ?? ""}
          onChange={(e) => handleChange(field.name, e.target.value)}
        />
      </div>
    );
  });

  return inputFields;
}
