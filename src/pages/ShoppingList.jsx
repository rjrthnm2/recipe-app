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
  const [selectedIngredientKeys, setSelectedIngredientKeys] = useState(
    () => new Set(),
  );
  const [customItemText, setCustomItemText] = useState("");
  const [customItems, setCustomItems] = useState([]);
  const [shoppingListCreated, setShoppingListCreated] = useState(false);
  const [finalListMinimized, setFinalListMinimized] = useState(false);
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
        setSelectedIngredientKeys(new Set());
        setCustomItems([]);
        setCustomItemText("");
        setShoppingListCreated(false);
        setFinalListMinimized(false);
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

  const selectedShoppingItems = useMemo(() => {
    return shoppingList.filter((item) => selectedIngredientKeys.has(item.text));
  }, [shoppingList, selectedIngredientKeys]);

  const finalShoppingList = useMemo(() => {
    return [...selectedShoppingItems, ...customItems].sort((a, b) => {
      if (a.type !== b.type) return a.type === "custom" ? 1 : -1;
      return a.text.localeCompare(b.text);
    });
  }, [selectedShoppingItems, customItems]);

  const selectedIngredientCount = selectedShoppingItems.length;
  const totalIngredientCount = shoppingList.length;
  const selectionProgress =
    totalIngredientCount > 0
      ? Math.round((selectedIngredientCount / totalIngredientCount) * 100)
      : 0;

  const selectedRecipeCount = useMemo(() => {
    const recipeUrls = new Set(selectedRecipeUrls);
    Object.values(planner).forEach((day) => {
      Object.values(day).forEach((url) => {
        if (url) recipeUrls.add(url);
      });
    });
    Object.values(dayPlanner).forEach((url) => {
      if (url) recipeUrls.add(url);
    });
    return recipeUrls.size;
  }, [selectedRecipeUrls, planner, dayPlanner]);

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
      setSelectedIngredientKeys(new Set());
      setCustomItems([]);
      setCustomItemText("");
      setShoppingListCreated(false);
      setFinalListMinimized(false);
    } else if (
      activeTab === "planner" ||
      (selectingFor && selectingFor.type === "week")
    ) {
      const init = {};
      DAYS.forEach((d) => {
        init[d] = { Breakfast: null, Lunch: null, Dinner: null };
      });
      setPlanner(init);
      setSelectedIngredientKeys(new Set());
      setCustomItems([]);
      setCustomItemText("");
      setShoppingListCreated(false);
      setFinalListMinimized(false);
    } else if (
      activeTab === "day" ||
      (selectingFor && selectingFor.type === "day")
    ) {
      setDayPlanner({ Breakfast: null, Lunch: null, Dinner: null });
      setSelectedIngredientKeys(new Set());
      setCustomItems([]);
      setCustomItemText("");
      setShoppingListCreated(false);
      setFinalListMinimized(false);
    }
  };

  const createShoppingList = () => {
    setShoppingListCreated(true);
    setFinalListMinimized(false);
  };

  const selectAllIngredients = () => {
    setSelectedIngredientKeys(new Set(shoppingList.map((item) => item.text)));
  };

  const clearIngredientSelection = () => {
    setSelectedIngredientKeys(new Set());
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

  const toggleIngredientSelection = (itemText) => {
    setSelectedIngredientKeys((prev) => {
      const next = new Set(prev);
      if (next.has(itemText)) {
        next.delete(itemText);
      } else {
        next.add(itemText);
      }
      return next;
    });
  };

  const addCustomItem = () => {
    const trimmed = customItemText.trim();
    if (!trimmed) return;

    setCustomItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: trimmed,
        type: "custom",
      },
    ]);
    setCustomItemText("");
  };

  const removeShoppingItem = (item) => {
    if (item.type === "custom") {
      setCustomItems((prev) => prev.filter((entry) => entry.id !== item.id));
      return;
    }

    setSelectedIngredientKeys((prev) => {
      const next = new Set(prev);
      next.delete(item.text);
      return next;
    });
  };

  const copyToClipboard = async () => {
    if (finalShoppingList.length === 0) return;

    // Format a nice readable text string for notes apps
    const textToCopy = [
      "🛒 Shopping List",
      "-------------------",
      ...finalShoppingList.map((item) => `[ ] ${item.text}`),
      "-------------------",
      `From: ${Array.from(
        new Set(
          selectedShoppingItems.flatMap((item) => item.recipeTitle.split(", ")),
        ),
      ).join(", ")}`,
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
              <div className="flex items-center justify-between bg-[#2596be]/10 border border-[#2596be]/30 p-4 rounded-[12px]">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-[#2596be]">
                    Selecting {selectingFor.meal}
                  </h2>
                  <p className="font-sans text-[16px] text-[#1f7ea0]">
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
                      className="cursor-pointer transition-all duration-200 border-x border-b border-[#e2e8f0] border-t-[6px] border-t-[#2596be] hover:shadow-md bg-[#FAFAFA] rounded-[8px]"
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
                          className="text-[#2596be] hover:bg-[#F8FAFC] font-ui font-bold ml-2"
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
                                <span className="font-bold text-[#155e78] truncate">
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
                                className="h-6 px-2 py-0 border-[#2596be]/30 text-[#1f7ea0] hover:bg-[#2596be]/10 text-xs"
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
                            <p className="text-lg text-[#155e78] font-bold leading-tight">
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
                            className="border-[#2596be]/30 text-[#1f7ea0] hover:bg-[#2596be]/10 bg-white"
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
                        className={`cursor-pointer transition-all duration-200 border-x border-b border-t-[6px] border-t-[#2596be] hover:shadow-md rounded-[8px] overflow-hidden ${
                          isSelected
                            ? "border-x-[#2596be] border-b-[#2596be] bg-[#2596be]/5"
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
                                  ? "data-[state=checked]:bg-[#2596be] data-[state=checked]:border-[#2596be] text-white"
                                  : ""
                              }`}
                            />
                          </div>
                          <div>
                            <h3
                              className={`font-heading font-bold text-[18px] leading-tight ${
                                isSelected ? "text-[#2596be]" : "text-[#0F172A]"
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
                  <span>Combined ingredients</span>
                  {selectedRecipeCount > 0 && (
                    <span className="bg-[#2596be]/15 text-[#155e78] text-sm py-1 px-3 rounded-full print:hidden">
                      {selectedRecipeCount} recipes
                    </span>
                  )}
                </h2>

                {!shoppingListCreated && shoppingList.length > 0 && (
                  <div className="print:hidden">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={createShoppingList}
                      disabled={selectedIngredientCount === 0}
                      className="bg-[#2596be] hover:bg-[#1f86ad] text-white"
                    >
                      Create shopping list
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-grow print:p-0 print:overflow-visible">
              <div className="space-y-6 print:space-y-4">
                {shoppingListCreated && (
                  <section className="sticky top-0 z-20 print:static">
                    {finalListMinimized ? (
                      <div className="mb-4 rounded-xl border border-[#2596be]/30 bg-white/95 p-3 shadow-md backdrop-blur print:hidden">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-ui text-[13px] uppercase tracking-wide text-[#2596be]">
                              Shopping list ready
                            </p>
                            <p className="font-sans text-sm text-[#0F172A]">
                              {finalShoppingList.length} items selected
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFinalListMinimized(false)}
                            className="border-[#2596be]/40 text-[#2596be] hover:bg-[#2596be]/10"
                          >
                            Open
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4 rounded-2xl border border-[#2596be]/30 bg-white/95 p-4 shadow-lg backdrop-blur transition-all duration-300 motion-safe:animate-in motion-safe:slide-in-from-top-2 print:mb-0 print:rounded-none print:border-black print:shadow-none print:bg-white print:p-0">
                        <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 print:border-black print:pb-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-bold text-[#0F172A]">
                                Final shopping list
                              </h3>
                              <p className="text-sm text-zinc-500 print:hidden">
                                Always visible while you pick ingredients.
                              </p>
                            </div>
                            <span className="text-sm font-medium text-zinc-500 print:hidden">
                              {finalShoppingList.length} items
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 print:hidden">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={copyToClipboard}
                              className="bg-white"
                              disabled={finalShoppingList.length === 0}
                            >
                              {copied ? "Copied!" : "Copy"}
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={handlePrint}
                              className="bg-[#2596be] text-white hover:bg-[#1f86ad]"
                              disabled={finalShoppingList.length === 0}
                            >
                              Print
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFinalListMinimized(true)}
                              className="text-zinc-600 hover:bg-zinc-100"
                            >
                              Minimize
                            </Button>
                          </div>
                        </div>

                        <div className="pt-4 print:pt-2">
                          <div className="flex gap-2 print:hidden">
                            <Input
                              value={customItemText}
                              onChange={(e) =>
                                setCustomItemText(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addCustomItem();
                                }
                              }}
                              placeholder="Add extra item, like milk or foil..."
                              className="h-11 bg-white text-[16px] border-[#e2e8f0] font-sans"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="h-11 shrink-0 border-[#2596be]/30 text-[#1f7ea0] hover:bg-[#2596be]/10"
                              onClick={addCustomItem}
                            >
                              Add
                            </Button>
                          </div>

                          {finalShoppingList.length === 0 ? (
                            <div className="mt-3 rounded-xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500 print:border-black print:text-black">
                              Select ingredients below or add custom items here.
                            </div>
                          ) : (
                            <ul className="mt-3 max-h-[320px] space-y-3 overflow-y-auto pr-1 print:mt-2 print:max-h-max print:space-y-2 print:overflow-visible print:pr-0">
                              {finalShoppingList.map((item, id) => (
                                <li
                                  key={item.id || `${item.text}-${id}`}
                                  className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3 print:border-black print:rounded-none print:p-0 print:border-0"
                                >
                                  <Checkbox
                                    id={`cart-${id}`}
                                    checked
                                    onCheckedChange={() =>
                                      removeShoppingItem(item)
                                    }
                                    className="mt-1 h-5 w-5 shrink-0 print:hidden"
                                  />
                                  <div className="hidden print:block w-5 h-5 border-2 border-black rounded-sm mt-1 shrink-0"></div>
                                  <label
                                    htmlFor={`cart-${id}`}
                                    className="grid flex-1 cursor-pointer gap-1.5"
                                  >
                                    <span className="text-base font-medium leading-snug text-[#0F172A] print:text-black print:text-xl">
                                      {item.text}
                                    </span>
                                    {item.type === "custom" ? (
                                      <span className="text-xs uppercase tracking-wide text-zinc-400 print:text-zinc-700">
                                        Added manually
                                      </span>
                                    ) : (
                                      <span className="text-sm text-zinc-500 print:text-zinc-800">
                                        From recipes: {item.recipeTitle}
                                      </span>
                                    )}
                                  </label>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                <section className="space-y-3 print:hidden">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-zinc-500">
                        Select ingredients Mou needs, then create the shopping
                        list.
                      </p>
                      {!shoppingListCreated &&
                        selectedIngredientCount === 0 &&
                        shoppingList.length > 0 && (
                          <p className="mt-1 text-xs font-medium text-[#2596be]">
                            Select at least one ingredient to enable "Create
                            shopping list".
                          </p>
                        )}
                    </div>
                    <span className="text-sm font-medium text-zinc-500">
                      {shoppingList.length} items
                    </span>
                  </div>

                  {shoppingList.length > 0 && (
                    <div className="rounded-xl border border-[#e2e8f0] bg-[#F8FAFC] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-ui text-[13px] uppercase tracking-wide text-[#64748b]">
                            Selection progress
                          </p>
                          <p className="font-sans text-sm text-[#0F172A]">
                            {selectedIngredientCount} of {totalIngredientCount}{" "}
                            selected
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={selectAllIngredients}
                            disabled={totalIngredientCount === 0}
                            className="border-[#cbd5e1] bg-white"
                          >
                            Select all
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearIngredientSelection}
                            disabled={selectedIngredientCount === 0}
                            className="border-[#cbd5e1] bg-white"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
                        <div
                          className="h-full rounded-full bg-[#2596be] transition-all duration-300"
                          style={{ width: `${selectionProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {shoppingList.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500">
                      Select recipes on the left to build the combined
                      ingredient list.
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {shoppingList.map((item, id) => {
                        const isChecked = selectedIngredientKeys.has(item.text);

                        return (
                          <li
                            key={`${item.text}-${id}`}
                            className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                              isChecked
                                ? "border-[#2596be]/30 bg-[#2596be]/10"
                                : "border-zinc-200 hover:bg-zinc-50"
                            }`}
                          >
                            <Checkbox
                              id={`ingredient-${id}`}
                              checked={isChecked}
                              onCheckedChange={() =>
                                toggleIngredientSelection(item.text)
                              }
                              className="mt-1 h-5 w-5 shrink-0"
                            />
                            <label
                              htmlFor={`ingredient-${id}`}
                              className="grid flex-1 cursor-pointer gap-1.5"
                            >
                              <span className="text-base font-medium leading-snug text-[#0F172A]">
                                {item.text}
                              </span>
                              <span className="text-sm text-zinc-500">
                                Used in: {item.recipeTitle}
                              </span>
                              {item.originals && item.originals.length > 0 && (
                                <span className="text-xs text-zinc-400">
                                  Matches: {item.originals.join(" & ")}
                                </span>
                              )}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </div>
            </div>
            {shoppingListCreated && finalShoppingList.length > 0 && (
              <div className="p-4 border-t border-zinc-200 bg-zinc-50 text-center print:hidden">
                <p className="text-sm text-zinc-500">
                  {finalShoppingList.length} total items
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
