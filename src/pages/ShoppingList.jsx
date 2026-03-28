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

export default function ShoppingList() {
  const { recipes } = useRecipes();
  // Set of recipe URLs that are currently selected for the shopping list
  const [selectedRecipeUrls, setSelectedRecipeUrls] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Aggregate ingredients from selected recipes
  const shoppingList = useMemo(() => {
    if (selectedRecipeUrls.size === 0) return [];

    const allIngredients = [];
    const selectedRecipes = recipes.filter((r) =>
      selectedRecipeUrls.has(r.url),
    );

    selectedRecipes.forEach((recipe) => {
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach((item) => {
          allIngredients.push({
            text: item,
            recipeTitle: recipe.title,
          });
        });
      }
    });

    // In a future phase we can parse and combine identical ingredients here.
    // For now we just return the flat list.
    return allIngredients;
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

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;
    const lowerQuery = searchQuery.toLowerCase();
    return recipes.filter((r) => r.title?.toLowerCase().includes(lowerQuery));
  }, [recipes, searchQuery]);

  return (
    <div className="space-y-10 pb-20">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          Build a Shopping List
        </h1>
        <p className="text-lg text-zinc-700 max-w-2xl">
          Select the recipes you want to make, and we'll compile all the
          ingredients you need into one list.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recipe Selection */}
        <div className="lg:col-span-7 space-y-6">
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
        <div className="lg:col-span-5">
          <div className="sticky top-24 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-zinc-100 p-6 border-b border-zinc-200">
              <h2 className="text-2xl font-bold flex items-center justify-between">
                <span>Your List</span>
                {selectedRecipeUrls.size > 0 && (
                  <span className="bg-teal-100 text-teal-800 text-sm py-1 px-3 rounded-full">
                    {selectedRecipeUrls.size} recipes
                  </span>
                )}
              </h2>
            </div>

            <div className="p-6 overflow-y-auto flex-grow">
              {shoppingList.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 space-y-4">
                  <div className="text-4xl">🛒</div>
                  <p className="text-lg">
                    Select recipes from the left to build your list.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {shoppingList.map((item, id) => (
                    <li
                      key={id}
                      className="flex items-start gap-3 p-2 rounded hover:bg-zinc-50 transition-colors"
                    >
                      <Checkbox id={`item-${id}`} className="mt-1 w-5 h-5" />
                      <div className="grid gap-1.5 flex-1">
                        <label
                          htmlFor={`item-${id}`}
                          className="text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {item.text}
                        </label>
                        <p className="text-sm text-zinc-500">
                          from {item.recipeTitle}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {shoppingList.length > 0 && (
              <div className="p-4 border-t border-zinc-200 bg-zinc-50 text-center">
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
