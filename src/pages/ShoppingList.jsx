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

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const MEALS = ["Breakfast", "Lunch", "Dinner"];

export default function ShoppingList() {
  const { recipes } = useRecipes();
  // Set of recipe URLs that are currently selected for the shopping list
  const [selectedRecipeUrls, setSelectedRecipeUrls] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const [activeTab, setActiveTab] = useState("quick");
  const [planner, setPlanner] = useState(() => {
    const init = {};
    DAYS.forEach((d) => {
      init[d] = { Breakfast: null, Lunch: null, Dinner: null };
    });
    return init;
  });
  const [dayPlanner, setDayPlanner] = useState({
    Breakfast: null,
    Lunch: null,
    Dinner: null,
  });
  const [selectingFor, setSelectingFor] = useState(null);

  const totalItemsSelectedCount = useMemo(() => {
    let count = selectedRecipeUrls.size;
    Object.values(planner).forEach((day) => {
      Object.values(day).forEach((url) => {
        if (url) count++;
      });
    });
    Object.values(dayPlanner).forEach((url) => {
      if (url) count++;
    });
    return count;
  }, [selectedRecipeUrls, planner, dayPlanner]);

  const handleTabSwitch = (newTab) => {
    if (activeTab === newTab) return;

    if (totalItemsSelectedCount > 0) {
      if (
        window.confirm(
          "Switching planners will clear your currently selected recipes. Continue?",
        )
      ) {
        setSelectedRecipeUrls(new Set());
        const initPlanner = {};
        DAYS.forEach((d) => {
          initPlanner[d] = { Breakfast: null, Lunch: null, Dinner: null };
        });
        setPlanner(initPlanner);
        setDayPlanner({ Breakfast: null, Lunch: null, Dinner: null });
        setSelectingFor(null);
        setActiveTab(newTab);
      }
    } else {
      setActiveTab(newTab);
    }
  };

  // Aggregate ingredients from selected recipes
  const shoppingList = useMemo(() => {
    const allUrls = Array.from(selectedRecipeUrls);
    Object.values(planner).forEach((day) => {
      Object.values(day).forEach((url) => {
        if (url) allUrls.push(url);
      });
    });
    Object.values(dayPlanner).forEach((url) => {
      if (url) allUrls.push(url);
    });

    if (allUrls.length === 0) return [];

    const grouped = new Map();
    const selectedRecipes = allUrls
      .map((url) => recipes.find((r) => r.url === url))
      .filter(Boolean);

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
  }, [recipes, selectedRecipeUrls, planner, dayPlanner]);

  const removeMeal = (type, day, meal) => {
    if (type === "week") {
      setPlanner((prev) => ({
        ...prev,
        [day]: { ...prev[day], [meal]: null },
      }));
    } else {
      setDayPlanner((prev) => ({ ...prev, [meal]: null }));
    }
  };

  const clearSelection = () => {
    if (
      activeTab === "quick" ||
      (selectingFor && selectingFor.type === "quick")
    ) {
      setSelectedRecipeUrls(new Set());
    } else if (
      activeTab === "planner" ||
      (selectingFor && selectingFor.type === "week")
    ) {
      const init = {};
      DAYS.forEach((d) => {
        init[d] = { Breakfast: null, Lunch: null, Dinner: null };
      });
      setPlanner(init);
    } else if (
      activeTab === "day" ||
      (selectingFor && selectingFor.type === "day")
    ) {
      setDayPlanner({ Breakfast: null, Lunch: null, Dinner: null });
    }
  };

  const handlePlannerSelect = (url) => {
    if (selectingFor) {
      if (selectingFor.type === "week") {
        setPlanner((prev) => ({
          ...prev,
          [selectingFor.day]: {
            ...prev[selectingFor.day],
            [selectingFor.meal]: url,
          },
        }));
      } else {
        setDayPlanner((prev) => ({ ...prev, [selectingFor.meal]: url }));
      }
      setSelectingFor(null);
      setSearchQuery("");
    }
  };

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
        <h1 className="font-heading text-4xl font-bold tracking-tight text-[#0F172A]">
          Build a Shopping List
        </h1>
        <p className="font-sans text-[18px] text-[#0F172A]/80 max-w-2xl">
          Select the recipes you want to make, and we'll compile all the
          ingredients you need into one list.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:w-full">
        {/* Left Column: Recipe Selection */}
        <div className="lg:col-span-7 space-y-6 print:hidden">
          {!selectingFor && (
            <div className="flex p-1 bg-[#F8FAFC] rounded-[8px] w-full sm:w-auto max-w-md border border-[#e2e8f0] shadow-sm mb-6">
              <button
                className={`flex-1 py-2 px-2 rounded-[6px] font-ui font-semibold text-[16px] transition-colors ${
                  activeTab === "quick"
                    ? "bg-white shadow-sm text-[#0F172A] border border-[#e2e8f0]"
                    : "text-[#64748b] hover:text-[#0F172A]"
                }`}
                onClick={() => handleTabSwitch("quick")}
              >
                Quick Select
              </button>
              <button
                className={`flex-1 py-2 px-2 rounded-[6px] font-ui font-semibold text-[16px] transition-colors ${
                  activeTab === "day"
                    ? "bg-white shadow-sm text-[#0F172A] border border-[#e2e8f0]"
                    : "text-[#64748b] hover:text-[#0F172A]"
                }`}
                onClick={() => handleTabSwitch("day")}
              >
                1-Day Plan
              </button>
              <button
                className={`flex-1 py-2 px-2 rounded-[6px] font-ui font-semibold text-[16px] transition-colors ${
                  activeTab === "planner"
                    ? "bg-white shadow-sm text-[#0F172A] border border-[#e2e8f0]"
                    : "text-[#64748b] hover:text-[#0F172A]"
                }`}
                onClick={() => handleTabSwitch("planner")}
              >
                Week Plan
              </button>
            </div>
          )}

          {selectingFor ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-teal-50/50 border border-teal-200 p-4 rounded-[12px]">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-[#0D9488]">
                    Selecting {selectingFor.meal}
                  </h2>
                  <p className="font-sans text-[16px] text-teal-700">
                    for {selectingFor.day}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectingFor(null);
                    setSearchQuery("");
                  }}
                  className="bg-white font-ui font-bold text-[#0F172A]"
                >
                  Cancel
                </Button>
              </div>
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white h-12 text-[18px] border-[#e2e8f0] font-sans"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 pb-4">
                {filteredRecipes.length === 0 ? (
                  <div className="col-span-1 md:col-span-2 text-center py-10 text-[#64748b] font-sans">
                    No recipes found matching "{searchQuery}"
                  </div>
                ) : (
                  filteredRecipes.map((recipe) => (
                    <Card
                      key={recipe.url}
                      className="cursor-pointer transition-all duration-200 border-x border-b border-[#e2e8f0] border-t-[6px] border-t-[#0D9488] hover:shadow-md bg-[#FAFAFA] rounded-[8px]"
                      onClick={() => handlePlannerSelect(recipe.url)}
                    >
                      <CardContent className="p-4 flex items-center justify-between h-full">
                        <div>
                          <h3 className="font-heading font-bold text-[18px] leading-tight text-[#0F172A]">
                            {recipe.title}
                          </h3>
                        </div>
                        <Button
                          variant="ghost"
                          className="text-[#0D9488] hover:bg-[#F8FAFC] font-ui font-bold ml-2"
                        >
                          Add
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === "planner" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-2xl font-bold text-[#0F172A]">
                  Plan Your Week
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-ui text-[#0F172A] border-[#e2e8f0]"
                  onClick={clearSelection}
                >
                  Clear Week
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="bg-white border-2 border-[#e2e8f0] rounded-[8px] shadow-sm overflow-hidden flex flex-col"
                  >
                    <div className="bg-[#F8FAFC] border-b border-[#e2e8f0] px-4 py-2 font-ui font-semibold text-[#0F172A]">
                      {day}
                    </div>
                    <div className="p-3 space-y-3 flex-1 flex flex-col justify-center">
                      {MEALS.map((meal) => {
                        const recipeUrl = planner[day][meal];
                        const recipe = recipeUrl
                          ? recipes.find((r) => r.url === recipeUrl)
                          : null;

                        return (
                          <div
                            key={meal}
                            className="flex items-center justify-between text-[16px] group font-sans"
                          >
                            <div className="flex items-center gap-3 overflow-hidden mr-2">
                              <span className="w-20 shrink-0 font-ui font-medium text-[#64748b] uppercase tracking-wide text-[12px]">
                                {meal}
                              </span>
                              {recipe ? (
                                <span className="font-bold text-teal-900 truncate">
                                  {recipe.title}
                                </span>
                              ) : (
                                <span className="text-zinc-400 italic">
                                  None
                                </span>
                              )}
                            </div>

                            {recipe ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 hover:text-white hover:bg-red-500 transition-colors"
                                onClick={() => removeMeal("week", day, meal)}
                                title="Remove meal"
                              >
                                &times;
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 py-0 border-teal-200 text-teal-700 hover:bg-teal-50 text-xs"
                                onClick={() => {
                                  setSelectingFor({ type: "week", day, meal });
                                  setSearchQuery("");
                                }}
                              >
                                + Add
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === "day" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">1-Day Plan</h2>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear Day
                </Button>
              </div>
              <Card className="border-2 border-zinc-200 shadow-sm overflow-hidden">
                <CardContent className="p-0 divide-y divide-zinc-100">
                  {MEALS.map((meal) => {
                    const recipeUrl = dayPlanner[meal];
                    const recipe = recipeUrl
                      ? recipes.find((r) => r.url === recipeUrl)
                      : null;

                    return (
                      <div
                        key={meal}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 transition-colors hover:bg-zinc-50 group"
                      >
                        <div>
                          <p className="font-semibold text-zinc-500 text-sm uppercase tracking-wider mb-1">
                            {meal}
                          </p>
                          {recipe ? (
                            <p className="text-lg text-teal-900 font-bold leading-tight">
                              {recipe.title}
                            </p>
                          ) : (
                            <p className="text-base text-zinc-400 italic">
                              No recipe selected
                            </p>
                          )}
                        </div>
                        {recipe ? (
                          <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-white border border-red-100 shadow-sm transition-opacity"
                            onClick={() => removeMeal("day", null, meal)}
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="border-teal-200 text-teal-700 hover:bg-teal-50 bg-white"
                            onClick={() => {
                              setSelectingFor({
                                type: "day",
                                day: "today",
                                meal,
                              });
                              setSearchQuery("");
                            }}
                          >
                            + Add Recipe
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-heading text-2xl font-bold text-[#0F172A]">
                  Quick Select
                </h2>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Input
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:max-w-xs bg-white h-10 border-[#e2e8f0] font-sans text-[16px]"
                  />
                  {selectedRecipeUrls.size > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearSelection}
                      className="whitespace-nowrap h-10 font-ui text-[#0F172A] border-[#e2e8f0] hover:bg-[#F8FAFC]"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[800px] overflow-y-auto pr-2 pb-4">
                {filteredRecipes.length === 0 ? (
                  <div className="col-span-1 md:col-span-2 text-center py-10 text-[#64748b] font-sans">
                    No recipes found matching "{searchQuery}"
                  </div>
                ) : (
                  filteredRecipes.map((recipe) => {
                    const isSelected = selectedRecipeUrls.has(recipe.url);
                    return (
                      <Card
                        key={recipe.url}
                        className={`cursor-pointer transition-all duration-200 border-x border-b border-t-[6px] border-t-[#0D9488] hover:shadow-md rounded-[8px] overflow-hidden ${
                          isSelected
                            ? "border-x-[#0D9488] border-b-[#0D9488] bg-[#0D9488]/5"
                            : "border-x-[#e2e8f0] border-b-[#e2e8f0] bg-[#FAFAFA]"
                        }`}
                        onClick={() => toggleRecipeSelection(recipe.url)}
                      >
                        <CardContent className="p-4 flex items-start gap-4 h-full">
                          <div className="mt-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                toggleRecipeSelection(recipe.url)
                              }
                              className={`h-5 w-5 border-[#e2e8f0] ${
                                isSelected
                                  ? "data-[state=checked]:bg-[#0D9488] data-[state=checked]:border-[#0D9488] text-white"
                                  : ""
                              }`}
                            />
                          </div>
                          <div>
                            <h3
                              className={`font-heading font-bold text-[18px] leading-tight ${
                                isSelected ? "text-[#0D9488]" : "text-[#0F172A]"
                              }`}
                            >
                              {recipe.title}
                            </h3>
                            {recipe.ingredients && (
                              <p className="font-sans text-[14px] text-[#64748b] mt-1">
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
            </>
          )}
        </div>

        {/* Right Column: The List */}
        <div className="lg:col-span-5 print:w-full print:block">
          <div className="sticky top-24 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col max-h-[80vh] print:max-h-max print:border-none print:shadow-none print:rounded-none">
            <div className="bg-zinc-100 p-6 border-b border-zinc-200 print:bg-white print:p-0 print:border-b-2 print:border-black print:pb-4 print:mb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span>Your List</span>
                  {totalItemsSelectedCount > 0 && (
                    <span className="bg-teal-100 text-teal-800 text-sm py-1 px-3 rounded-full print:hidden">
                      {totalItemsSelectedCount} recipes
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
