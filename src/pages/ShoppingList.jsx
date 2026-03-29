import { useState, useMemo } from "react";
import { useRecipes } from "../hooks/useRecipes";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";

// A heuristic parser for recipe ingredients
function parseIngredient(rawText) {
  const text = String(rawText).trim();
  // 1. Extract quantity (e.g. "1", "1.5", "1 1/2", "1/2")
  const qtyMatch = text.match(/^(\d+(?:[\s-]\d+\/\d+|\/\d+|\.\d+)?)\s*(.*)/);

  let amount = 0;
  let remainder = text;

  if (qtyMatch) {
    const qtyStr = qtyMatch[1].trim();
    remainder = qtyMatch[2].trim();

    // Convert fraction to decimal
    if (qtyStr.includes("/")) {
      const parts = qtyStr.split(/[\s-]/);
      if (parts.length === 2 && parts[1].includes("/")) {
        const [whole, frac] = parts;
        const [num, den] = frac.split("/");
        amount = parseInt(whole, 10) + parseInt(num, 10) / parseInt(den, 10);
      } else if (parts.length === 1) {
        const [num, den] = parts[0].split("/");
        amount = parseInt(num, 10) / parseInt(den, 10);
      }
    } else {
      amount = parseFloat(qtyStr);
    }
  }

  // 2. Extract common units
  const unitRegex =
    /^(cups?|oz|ounces?|lbs?|pounds?|tbsps?|tablespoons?|tsps?|teaspoons?|g|kg|ml|l|cloves?|cans?|pinches?|dashes?|slices?|packages?|boxes?|jars?|bunch(?:es)?|stalks?|heads?)\b(?: of\b)?\s*(.*)/i;
  const unitMatch = remainder.match(unitRegex);

  let unit = "";
  if (unitMatch) {
    unit = unitMatch[1].toLowerCase();

    // Normalize basic plural units to singular for grouping
    const unitMap = {
      cups: "cup",
      ounces: "oz",
      pounds: "lb",
      lbs: "lb",
      tablespoons: "tbsp",
      tbsps: "tbsp",
      teaspoons: "tsp",
      tsps: "tsp",
      cloves: "clove",
      cans: "can",
      pinches: "pinch",
      dashes: "dash",
      slices: "slice",
      packages: "package",
      boxes: "box",
      jars: "jar",
      bunches: "bunch",
      stalks: "stalk",
      heads: "head",
    };
    unit = unitMap[unit] || unit;
    remainder = unitMatch[2].trim();
  }

  // 3. Clean up the ingredient name
  // Remove everything after a comma (e.g. ", chopped") and parentheses
  let name = remainder
    .split(",")[0]
    .replace(/\(.*?\)/g, "")
    .trim()
    .toLowerCase();

  // If we ended up stripping everything, fallback
  if (!name) name = remainder.toLowerCase() || "unknown";

  return { amount: amount || 0, unit, name, original: rawText };
}

export default function ShoppingList() {
  const { recipes } = useRecipes();
  // Set of recipe URLs that are currently selected for the shopping list
  const [selectedRecipeUrls, setSelectedRecipeUrls] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // Aggregate ingredients from selected recipes
  const shoppingList = useMemo(() => {
    if (selectedRecipeUrls.size === 0) return [];

    const grouped = new Map();
    const selectedRecipes = recipes.filter((r) =>
      selectedRecipeUrls.has(r.url),
    );

    selectedRecipes.forEach((recipe) => {
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach((item) => {
          const parsed = parseIngredient(item);
          // Group by name and unit
          const key = `${parsed.name}|${parsed.unit}`;

          if (!grouped.has(key)) {
            grouped.set(key, {
              name: parsed.name,
              unit: parsed.unit,
              amount: parsed.amount,
              recipes: new Set([recipe.title]),
              originals: new Set([item]),
            });
          } else {
            const existing = grouped.get(key);
            existing.amount += parsed.amount;
            existing.recipes.add(recipe.title);
            existing.originals.add(item);
          }
        });
      }
    });

    // Format output
    return Array.from(grouped.values())
      .map((g) => {
        const recipeList = Array.from(g.recipes).join(", ");
        const displayAmount = g.amount > 0 ? Number(g.amount.toFixed(2)) : "";
        let displayText = `${displayAmount ? displayAmount + " " : ""}${
          g.unit ? g.unit + " " : ""
        }${g.name}`.trim();

        // Capitalize first letter
        displayText =
          displayText.charAt(0).toUpperCase() + displayText.slice(1);

        return {
          text: displayText,
          recipeTitle: recipeList,
          originals: Array.from(g.originals),
        };
      })
      .sort((a, b) => a.text.localeCompare(b.text));
  }, [recipes, selectedRecipeUrls]);

  const toggleRecipeSelection = (url) => {
    setSelectedRecipeUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedRecipeUrls(new Set());
  };

  const copyToClipboard = async () => {
    if (shoppingList.length === 0) return;

    // Format a nice readable text string for notes apps
    const textToCopy = [
      "🛒 Shopping List",
      "-------------------",
      ...shoppingList.map((item) => `[ ] ${item.text}`),
      "-------------------",
      `From: ${Array.from(new Set(shoppingList.flatMap((item) => item.recipeTitle.split(", ")))).join(", ")}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy list:", err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;
    const lowerQuery = searchQuery.toLowerCase();
    return recipes.filter((r) => r.title?.toLowerCase().includes(lowerQuery));
  }, [recipes, searchQuery]);

  return (
    <div className="space-y-10 pb-20 print:space-y-4 print:pb-0">
      <div className="space-y-4 print:hidden">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          Build a Shopping List
        </h1>
        <p className="text-lg text-zinc-700 max-w-2xl">
          Select the recipes you want to make, and we'll compile all the
          ingredients you need into one list.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:w-full">
        {/* Left Column: Recipe Selection */}
        <div className="lg:col-span-7 space-y-6 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Available Recipes</h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:max-w-xs bg-white"
              />
              {selectedRecipeUrls.size > 0 && (
                <Button
                  variant="outline"
                  onClick={clearSelection}
                  className="whitespace-nowrap h-10"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[800px] overflow-y-auto pr-2 pb-4">
            {filteredRecipes.length === 0 ? (
              <div className="col-span-1 md:col-span-2 text-center py-10 text-zinc-500">
                No recipes found matching "{searchQuery}"
              </div>
            ) : (
              filteredRecipes.map((recipe) => {
                const isSelected = selectedRecipeUrls.has(recipe.url);
                return (
                  <Card
                    key={recipe.url}
                    className={`cursor-pointer transition-all duration-200 border-2 ${
                      isSelected
                        ? "border-teal-600 bg-teal-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                    onClick={() => toggleRecipeSelection(recipe.url)}
                  >
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="mt-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            toggleRecipeSelection(recipe.url)
                          }
                          className={
                            isSelected
                              ? "data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                              : ""
                          }
                        />
                      </div>
                      <div>
                        <h3
                          className={`font-bold text-lg leading-tight ${isSelected ? "text-teal-900" : "text-zinc-900"}`}
                        >
                          {recipe.title}
                        </h3>
                        {recipe.ingredients && (
                          <p className="text-sm text-zinc-500 mt-1">
                            {recipe.ingredients.length} ingredients
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: The List */}
        <div className="lg:col-span-5 print:w-full print:block">
          <div className="sticky top-24 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col max-h-[80vh] print:max-h-max print:border-none print:shadow-none print:rounded-none">
            <div className="bg-zinc-100 p-6 border-b border-zinc-200 print:bg-white print:p-0 print:border-b-2 print:border-black print:pb-4 print:mb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span>Your List</span>
                  {selectedRecipeUrls.size > 0 && (
                    <span className="bg-teal-100 text-teal-800 text-sm py-1 px-3 rounded-full print:hidden">
                      {selectedRecipeUrls.size} recipes
                    </span>
                  )}
                </h2>

                {shoppingList.length > 0 && (
                  <div className="flex items-center gap-2 print:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="bg-white"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handlePrint}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      Print
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-grow print:p-0 print:overflow-visible">
              {shoppingList.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 space-y-4 print:hidden">
                  <div className="text-4xl">🛒</div>
                  <p className="text-lg">
                    Select recipes from the left to build your list.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4 print:space-y-3">
                  {shoppingList.map((item, id) => (
                    <li
                      key={id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-zinc-50 transition-colors print:p-0"
                    >
                      <Checkbox
                        id={`item-${id}`}
                        className="mt-1 w-5 h-5 print:hidden"
                      />
                      <div className="hidden print:block w-5 h-5 border-2 border-black rounded-sm mt-1"></div>
                      <div className="grid gap-1.5 flex-1">
                        <label
                          htmlFor={`item-${id}`}
                          className="text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer print:text-black print:text-xl"
                        >
                          {item.text}
                        </label>
                        <p className="text-sm text-zinc-500 print:text-zinc-800">
                          Used in: {item.recipeTitle}
                        </p>
                        {item.originals && item.originals.length > 0 && (
                          <p className="text-xs text-zinc-400 mt-1 print:hidden">
                            Matches: {item.originals.join(" & ")}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {shoppingList.length > 0 && (
              <div className="p-4 border-t border-zinc-200 bg-zinc-50 text-center print:hidden">
                <p className="text-sm text-zinc-500">
                  {shoppingList.length} total items
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
