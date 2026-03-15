import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useRecipes } from "../hooks/useRecipes";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";

export default function RecipeDetail() {
  const { id } = useParams();
  const { recipes, toggleSave, savedIds } = useRecipes();
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [checkedIngredients, setCheckedIngredients] = useState({});

  // Find the recipe where the URL ends with our ID
  const recipe = recipes.find((r) => r.url.endsWith(id));

  if (!recipe) return <div className="p-8 text-center">Recipe not found.</div>;

  const isSaved = savedIds.includes(recipe.url);

  const recipeUrl = window.location.href;
  const encodedTitle = encodeURIComponent(`Recipe: ${recipe.title}`);
  const encodedBody = encodeURIComponent(
    `I wanted to share this recipe with you:\n${recipeUrl}`,
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(recipeUrl);
      setCopied(true);
      setShareMessage("Recipe link copied to clipboard.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setShareMessage(
        "Could not copy automatically. Please copy the URL from your browser.",
      );
    }
  };

  const toggleIngredientCheck = (ingredient) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [ingredient]: !prev[ingredient],
    }));
  };

  return (
    <article className="mx-auto max-w-4xl space-y-8 pb-20">
      <Link to="/" className="text-base text-zinc-700 hover:text-zinc-950">
        ← Back to Browse
      </Link>

      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{recipe.title}</h1>
        <div className="flex flex-wrap gap-2">
          {recipe.tags?.map((tag, i) => (
            <Badge key={i} variant="outline">
              {tag.replace(/[()]/g, "")}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-base text-zinc-800">
          <span>{recipe.prep_time} Prep</span>
          <span>{recipe.cook_time} Cook</span>
          <span>{recipe.servings} Servings</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => toggleSave(recipe.url)}
          variant={isSaved ? "secondary" : "default"}
          aria-label={
            isSaved ? "Remove recipe from saved list" : "Save recipe to my list"
          }
        >
          {isSaved ? "Saved" : "Save to My List"}
        </Button>

        <Button
          onClick={copyLink}
          variant="outline"
          aria-label="Copy recipe link"
        >
          {copied ? "Copied" : "Copy Link"}
        </Button>

        <Button asChild variant="outline" aria-label="Share recipe by email">
          <a href={`mailto:?subject=${encodedTitle}&body=${encodedBody}`}>
            Email Recipe
          </a>
        </Button>

        <Button
          onClick={() => window.print()}
          variant="outline"
          aria-label="Print recipe"
        >
          Print Recipe
        </Button>
      </div>

      {shareMessage && (
        <p role="status" className="text-base text-zinc-700">
          {shareMessage}
        </p>
      )}

      {recipe.author_note && (
        <div className="rounded-xl border border-zinc-200 bg-amber-50 p-5 italic text-zinc-800">
          "{recipe.author_note}"
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <h2 className="text-2xl font-semibold">Ingredients</h2>
          <ul className="space-y-3">
            {recipe.ingredients.map((ing, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-base text-zinc-900"
              >
                <Checkbox
                  id={`ingredient-${i}`}
                  checked={Boolean(checkedIngredients[ing])}
                  onCheckedChange={() => toggleIngredientCheck(ing)}
                  aria-label={`Mark ingredient as prepared: ${ing}`}
                  className="mt-0.5"
                />
                <label
                  htmlFor={`ingredient-${i}`}
                  className="cursor-pointer leading-relaxed"
                >
                  {ing}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h2 className="text-2xl font-semibold">Directions</h2>
          <ol className="space-y-6">
            {recipe.directions.map((step, i) => (
              <li
                key={i}
                className="flex gap-4 border-b border-zinc-200 pb-5 last:border-b-0"
              >
                <span className="text-3xl font-bold leading-none text-zinc-700">
                  {i + 1}
                </span>
                <p className="text-lg leading-relaxed text-zinc-900">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  );
}
