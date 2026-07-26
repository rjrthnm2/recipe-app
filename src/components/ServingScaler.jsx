import { scaleServings } from "../lib/units";

const STEPS = [
  { factor: 0.5, label: "Half" },
  { factor: 1, label: "Original" },
  { factor: 2, label: "Double" },
  { factor: 3, label: "Triple" },
];

// Ingredient-amount scaler for the recipe page. Plain words instead of
// "×0.5" so it reads at a glance, and it echoes the resulting serving
// count when the recipe has one.
export default function ServingScaler({ scale, onChange, servings }) {
  const scaledServings = servings ? scaleServings(servings, scale) : "";

  return (
    <div className="rounded-[8px] border border-border bg-secondary p-4 print:hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <span className="font-ui text-[16px] font-medium text-primary">
          Make:
        </span>

        <div
          role="group"
          aria-label="Scale ingredient amounts"
          className="flex flex-wrap gap-2"
        >
          {STEPS.map((step) => {
            const isActive = scale === step.factor;
            return (
              <button
                key={step.factor}
                type="button"
                onClick={() => onChange(step.factor)}
                aria-pressed={isActive}
                className={`min-h-[44px] rounded-full border px-5 font-ui text-[16px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isActive
                    ? "border-transparent bg-accent text-white"
                    : "border-border bg-white text-primary hover:bg-white/60"
                }`}
              >
                {step.label}
              </button>
            );
          })}
        </div>

        {scaledServings && (
          <span className="font-sans tabular text-[16px] text-muted-strong">
            {scale === 1 ? (
              <>Makes {scaledServings} servings</>
            ) : (
              <>
                Now makes{" "}
                <span className="font-semibold text-accent">
                  {scaledServings} servings
                </span>
              </>
            )}
          </span>
        )}
      </div>

      {scale !== 1 && (
        <p role="status" className="mt-3 font-sans text-[16px] text-primary/80">
          Ingredient amounts below are{" "}
          <strong className="font-semibold">
            {STEPS.find((s) => s.factor === scale)?.label.toLowerCase()}
          </strong>{" "}
          the original recipe. Cooking times stay the same.
        </p>
      )}
    </div>
  );
}
