import { databaseFields } from "@/lib/contentNormalizer";
import type { CreateProductInput } from "@/types";

const inputClass =
  "w-full rounded-md border border-brand-border bg-white px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-1 focus:ring-brand-black";

// Se renderizan los campos del formulario
// No tiene logica mas alla del formulario en si.
export function ProductModalFields({
  handleChange,
  form,
}: {
  handleChange: (key: keyof CreateProductInput, value: string | number) => void;
  form: CreateProductInput;
}) {
  const inpuitFields = databaseFields.map((field, i) => {
    return (
      <div className={i === 0 ? "col-span-2" : ""} key={field.name}>
        <label className="mb-1 block text-xs text-brand-text-secondary">
          {field.label}
        </label>
        <input
          className={inputClass}
          value={form[field.name] || ""}
          onChange={(e) => handleChange(field.name, e.target.value)}
        />
      </div>
    );
  });

  return inpuitFields;
}
