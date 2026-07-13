import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecipes } from "../hooks/useRecipes";
import { useToast } from "../components/Toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import IngredientsEditor from "../components/IngredientsEditor";
import { emptyIngredient, collectIngredientNames } from "../lib/units";
import usePageTitle from "../hooks/usePageTitle";

export default function AddRecipe() {
  usePageTitle("Add a Recipe");
  const { addRecipe, recipes } = useRecipes();
  const navigate = useNavigate();
  const showToast = useToast();
  const ingredientNames = useMemo(
    () => collectIngredientNames(recipes),
    [recipes],
  );

  const [formData, setFormData] = useState({
    title: "",
    author_note: "",
    prep_time: "",
    cook_time: "",
    servings: "",
    tags: "",
    ingredients: [emptyIngredient()],
    directions: [""],
  });
  const [saving, setSaving] = useState(false);

  // Warn before losing typed work on refresh / tab close.
  const isDirty =
    formData.title.trim() !== "" ||
    formData.ingredients.some((ing) => ing.name.trim() !== "") ||
    formData.directions.some((step) => step.trim() !== "");

  useEffect(() => {
    if (!isDirty || saving) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, saving]);

  const updateDirection = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      directions: prev.directions.map((step, i) =>
        i === index ? value : step,
      ),
    }));
  };

  const addDirection = () => {
    setFormData((prev) => ({ ...prev, directions: [...prev.directions, ""] }));
  };

  const removeDirection = (index) => {
    setFormData((prev) => {
      const next = prev.directions.filter((_, i) => i !== index);
      return { ...prev, directions: next.length > 0 ? next : [""] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Keep only ingredient rows that actually have a name, and tidy each field.
    const cleanedIngredients = formData.ingredients
      .filter((ing) => ing.name.trim() !== "")
      .map((ing) => ({
        quantity: ing.quantity.trim(),
        unit: ing.unit,
        name: ing.name.trim(),
        note: ing.note.trim(),
      }));

    if (cleanedIngredients.length === 0) {
      showToast("Please add at least one ingredient.", "error");
      return;
    }

    const cleanedDirections = formData.directions
      .map((step) => step.trim())
      .filter((step) => step !== "");

    if (cleanedDirections.length === 0) {
      showToast("Please add at least one direction step.", "error");
      return;
    }

    const newRecipe = {
      ...formData,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== "")
        .map((t) => (t.startsWith("(") ? t : `(${t})`)),
      ingredients: cleanedIngredients,
      directions: cleanedDirections,
    };

    setSaving(true);
    const newId = await addRecipe(newRecipe);
    if (newId) {
      // Need to use replace: true so going "back" goes to home screen instead of form
      navigate(`/recipe/${newId}`, { replace: true });
    } else {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-20">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-primary">
        Add New Recipe
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="title"
            className="font-sans text-[16px] text-primary"
          >
            Recipe Title
          </Label>
          <Input
            id="title"
            required
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="border-border font-sans text-[16px] h-12"
            placeholder="e.g. Grandma's Famous Chili"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label
              htmlFor="prep"
              className="font-sans text-[16px] text-primary"
            >
              Prep Time
            </Label>
            <Input
              id="prep"
              placeholder="10 minutes"
              value={formData.prep_time}
              onChange={(e) =>
                setFormData({ ...formData, prep_time: e.target.value })
              }
              className="border-border font-sans text-[16px] h-12"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="cook"
              className="font-sans text-[16px] text-primary"
            >
              Cook Time
            </Label>
            <Input
              id="cook"
              placeholder="30 minutes"
              value={formData.cook_time}
              onChange={(e) =>
                setFormData({ ...formData, cook_time: e.target.value })
              }
              className="border-border font-sans text-[16px] h-12"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="servings"
              className="font-sans text-[16px] text-primary"
            >
              Servings
            </Label>
            <Input
              id="servings"
              placeholder="4"
              value={formData.servings}
              onChange={(e) =>
                setFormData({ ...formData, servings: e.target.value })
              }
              className="border-border font-sans text-[16px] h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="tags"
            className="font-sans text-[16px] text-primary"
          >
            Tags (comma separated)
          </Label>
          <Input
            id="tags"
            placeholder="Ground beef, Quick, Dinner"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="border-border font-sans text-[16px] h-12"
          />
        </div>

        <div className="space-y-2">
          <Label className="font-sans text-[16px] text-primary">
            Ingredients
          </Label>
          <p className="font-sans text-[14px] text-muted-foreground">
            Enter an amount, pick a unit, and name the ingredient. The unit list
            keeps everything consistent across recipes.
          </p>
          <IngredientsEditor
            value={formData.ingredients}
            onChange={(ingredients) =>
              setFormData({ ...formData, ingredients })
            }
            suggestions={ingredientNames}
          />
        </div>

        <div className="space-y-2">
          <Label className="font-sans text-[16px] text-primary">
            Directions
          </Label>
          <div className="space-y-3">
            {formData.directions.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-3 w-6 shrink-0 text-right font-heading text-[20px] font-bold text-accent">
                  {i + 1}
                </span>
                <Textarea
                  value={step}
                  onChange={(e) => updateDirection(i, e.target.value)}
                  className="min-h-[64px] border-border font-sans text-[16px]"
                  placeholder={
                    i === 0 ? "e.g. Brown the beef in a large skillet" : ""
                  }
                  aria-label={`Direction step ${i + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-1 h-11 w-11 shrink-0 text-faded hover:bg-red-50 hover:text-destructive"
                  onClick={() => removeDirection(i)}
                  aria-label={`Remove step ${i + 1}`}
                >
                  &times;
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full border-dashed border-divider font-ui text-[16px] text-primary hover:border-accent hover:bg-accent/5"
              onClick={addDirection}
            >
              + Add step
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="note"
            className="font-sans text-[16px] text-primary"
          >
            Author Note (Optional)
          </Label>
          <Input
            id="note"
            value={formData.author_note}
            onChange={(e) =>
              setFormData({ ...formData, author_note: e.target.value })
            }
            className="border-border font-sans text-[16px] h-12"
          />
        </div>

        <Button
          type="submit"
          className="w-full text-[18px] bg-accent hover:bg-accent/90 text-white font-ui font-bold h-14 rounded-[8px] transition-colors mt-6"
        >
          Save Recipe
        </Button>
      </form>
    </div>
  );
}
