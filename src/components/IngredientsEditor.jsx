import { Input } from "./ui/input";
import { Button } from "./ui/button";
import UnitPicker from "./UnitPicker";
import IngredientCombobox from "./IngredientCombobox";
import { emptyIngredient } from "../lib/units";

// Shared column layout so the header labels line up with each row's fields.
const GRID =
  "sm:grid sm:grid-cols-[5rem_7rem_minmax(0,1fr)_10rem_2.75rem] sm:items-center sm:gap-3";

// Structured ingredient entry: one row per ingredient with
// amount + unit (chips + compact dropdown) + name (autocomplete) + optional note.
// `value` is an array of { quantity, unit, name, note }; `onChange` gets the
// updated array. `suggestions` powers the ingredient-name autocomplete.
export default function IngredientsEditor({ value, onChange, suggestions = [] }) {
  const rows = value && value.length > 0 ? value : [emptyIngredient()];

  const updateRow = (index, field, fieldValue) => {
    onChange(
      rows.map((row, i) =>
        i === index ? { ...row, [field]: fieldValue } : row,
      ),
    );
  };

  const addRow = () => onChange([...rows, emptyIngredient()]);

  const removeRow = (index) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [emptyIngredient()]);
  };

  const headerLabel =
    "font-ui text-[12px] font-medium uppercase tracking-wide text-[#64748b]";
  const mobileLabel =
    "mb-1 block font-ui text-[12px] text-[#64748b] sm:hidden";

  return (
    <div className="space-y-2">
      {/* Column header — desktop only; rows show inline labels on mobile. */}
      <div className={`hidden ${GRID} px-1`}>
        <span className={headerLabel}>Amount</span>
        <span className={headerLabel}>Unit</span>
        <span className={headerLabel}>Ingredient</span>
        <span className={headerLabel}>
          Note <span className="lowercase opacity-70">(optional)</span>
        </span>
        <span className="sr-only">Remove</span>
      </div>

      {rows.map((row, index) => (
        <div
          key={index}
          className={`space-y-2 rounded-[8px] border border-[#e2e8f0] bg-white p-3 sm:space-y-0 sm:rounded-md sm:border-0 sm:bg-transparent sm:p-1 sm:odd:bg-[#F8FAFC]/60 ${GRID}`}
        >
          <div>
            <span className={mobileLabel}>Amount</span>
            <Input
              value={row.quantity}
              onChange={(e) => updateRow(index, "quantity", e.target.value)}
              className="h-12 border-[#e2e8f0] font-sans text-[16px]"
              placeholder="1"
              aria-label={`Amount for ingredient ${index + 1}`}
            />
          </div>

          <div>
            <span className={mobileLabel}>Unit</span>
            <UnitPicker
              value={row.unit}
              onChange={(unit) => updateRow(index, "unit", unit)}
              ariaLabel={`Unit for ingredient ${index + 1}`}
            />
          </div>

          <div>
            <span className={mobileLabel}>Ingredient</span>
            <IngredientCombobox
              value={row.name}
              onChange={(name) => updateRow(index, "name", name)}
              suggestions={suggestions}
              placeholder="e.g. ground beef"
              ariaLabel={`Name for ingredient ${index + 1}`}
            />
          </div>

          <div>
            <span className={mobileLabel}>Note (optional)</span>
            <Input
              value={row.note}
              onChange={(e) => updateRow(index, "note", e.target.value)}
              className="h-12 border-[#e2e8f0] bg-[#F8FAFC]/40 font-sans text-[16px] text-[#475569]"
              placeholder="finely chopped"
              aria-label={`Note for ingredient ${index + 1}`}
            />
          </div>

          <div className="flex justify-end sm:block">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0 text-[#94a3b8] hover:bg-red-50 hover:text-[#dc2626]"
              onClick={() => removeRow(index)}
              aria-label={`Remove ingredient ${index + 1}`}
            >
              &times;
            </Button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="h-12 w-full border-dashed border-[#cbd5e1] font-ui text-[16px] text-[#0F172A] hover:border-[#2596be] hover:bg-[#2596be]/5"
        onClick={addRow}
      >
        + Add ingredient
      </Button>
    </div>
  );
}
