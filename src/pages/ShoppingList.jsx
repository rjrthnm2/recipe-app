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
import {
  parseQuantity,
  getUnitLabel,
  formatIngredient,
  isStructuredIngredient,
  cleanIngredientText,
} from "../lib/units";
import usePageTitle from "../hooks/usePageTitle";

// A heuristic parser for recipe ingredients
function parseIngredient(rawText) {
  // Structured ingredients (new format) need no guessing — use the fields.
  if (isStructuredIngredient(rawText)) {
    const amount = parseQuantity(rawText.quantity);
    const name = (rawText.name || "").trim().toLowerCase() || "unknown";
    // Use the singular canonical form so it groups with legacy parsed units.
    const unit =
      rawText.unit && rawText.unit !== "to_taste"
        ? getUnitLabel(rawText.unit, 1).toLowerCase()
        : "";
    return { amount: amount || 0, unit, name, original: formatIngredient(rawText) };
  }

  const text = cleanIngredientText(rawText);
  // 1. Extract quantity (e.g. "1", "1.5", "1 1/2", "1/2")
  const qtyMatch = text.match(/^(\d+(?:[\s-]\d+\/\d+|\/\d+|\.\d+)?)\s*(.*)/);

  let amount = 0;
  let remainder = text;

  if (qtyMatch) {
    const qtyStr = qtyMatch[1].trim();
    // Strip a stray dash/bullet left on the remainder, e.g. "1-can" -> "can".
    remainder = qtyMatch[2].replace(/^[\s*•◦‣⁃·‐-―-]+/, "").trim();

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
  usePageTitle("Shopping List");
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
  const [condensedExport, setCondensedExport] = useState(false);

  const [activeTab, setActiveTab] = useState("quick");
  // Mobile-only: show the ingredients/list panel as its own screen.
  const [mobileListView, setMobileListView] = useState(false);
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

  // In-app confirmation for switching planners with selections (replaces the
  // jarring native window.confirm). Holds the tab we're about to switch to.
  const [pendingTab, setPendingTab] = useState(null);
  // In-app confirmation for the Clear All / Clear Week / Clear Day buttons.
  const [pendingClear, setPendingClear] = useState(false);

  const handleTabSwitch = (newTab) => {
    if (activeTab === newTab) return;
    setPendingClear(false);

    if (totalItemsSelectedCount > 0) {
      setPendingTab(newTab);
    } else {
      setActiveTab(newTab);
    }
  };

  const confirmTabSwitch = () => {
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
    setActiveTab(pendingTab);
    setPendingTab(null);
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
          name: g.name.charAt(0).toUpperCase() + g.name.slice(1),
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

  // What the final list shows / copies / prints. "Condensed" = names only,
  // deduped (e.g. milk in cups + ml collapses to one "Milk").
  const finalDisplayList = useMemo(() => {
    if (!condensedExport) {
      return finalShoppingList.map((item, i) => ({
        key: item.id || `${item.text}-${i}`,
        label: item.text,
        custom: item.type === "custom",
        recipeTitle: item.recipeTitle,
        items: [item],
      }));
    }

    const map = new Map();
    finalShoppingList.forEach((item) => {
      const label =
        item.type === "custom" ? item.text : item.name || item.text;
      const dedupeKey = label.toLowerCase();
      if (!map.has(dedupeKey)) {
        map.set(dedupeKey, {
          key: dedupeKey,
          label,
          custom: item.type === "custom",
          recipeTitle: item.recipeTitle,
          items: [item],
        });
      } else {
        map.get(dedupeKey).items.push(item);
      }
    });
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [finalShoppingList, condensedExport]);

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

  // Discard the final list and go back to picking ingredients.
  // Keeps recipe + ingredient selections so nothing has to be re-ticked.
  const cancelShoppingList = () => {
    setShoppingListCreated(false);
    setFinalListMinimized(false);
    setCustomItems([]);
    setCustomItemText("");
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

  // Remove a display entry (in condensed mode it may cover several raw items).
  const removeDisplayEntry = (entry) => {
    entry.items.forEach((item) => removeShoppingItem(item));
  };

  const copyToClipboard = async () => {
    if (finalShoppingList.length === 0) return;

    // Format a nice readable text string for notes apps
    const textToCopy = [
      "🛒 Shopping List",
      "-------------------",
      ...finalDisplayList.map((entry) => `[ ] ${entry.label}`),
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

  // Alphabetical, matching Browse — the same list in two orders is confusing.
  const filteredRecipes = useMemo(() => {
    const sorted = [...recipes].sort((a, b) =>
      (a.title || "").localeCompare(b.title || ""),
    );
    if (!searchQuery.trim()) return sorted;
    const lowerQuery = searchQuery.toLowerCase();
    return sorted.filter((r) => r.title?.toLowerCase().includes(lowerQuery));
  }, [recipes, searchQuery]);

  return (
    <div className="space-y-10 pb-20 print:space-y-4 print:pb-0">
      <div className="space-y-4 print:hidden">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-primary">
          Build a Shopping List
        </h1>
        <p className="font-sans text-[18px] text-primary/80 max-w-2xl">
          Select the recipes you want to make, and we'll compile all the
          ingredients you need into one list.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:w-full">
        {/* Left Column: Recipe Selection */}
        <div
          className={`lg:col-span-7 space-y-6 print:hidden ${
            mobileListView ? "hidden lg:block" : ""
          }`}
        >
          {!selectingFor && (
            <div className="flex p-1 bg-secondary rounded-[8px] w-full sm:w-auto max-w-md border border-border shadow-sm mb-6">
              <button
                className={`flex-1 py-2 px-2 rounded-[6px] font-ui font-semibold text-[16px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  activeTab === "quick"
                    ? "bg-white shadow-sm text-primary border border-border"
                    : "text-muted-strong hover:text-primary"
                }`}
                onClick={() => handleTabSwitch("quick")}
              >
                Quick Select
              </button>
              <button
                className={`flex-1 py-2 px-2 rounded-[6px] font-ui font-semibold text-[16px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  activeTab === "day"
                    ? "bg-white shadow-sm text-primary border border-border"
                    : "text-muted-strong hover:text-primary"
                }`}
                onClick={() => handleTabSwitch("day")}
              >
                1-Day Plan
              </button>
              <button
                className={`flex-1 py-2 px-2 rounded-[6px] font-ui font-semibold text-[16px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  activeTab === "planner"
                    ? "bg-white shadow-sm text-primary border border-border"
                    : "text-muted-strong hover:text-primary"
                }`}
                onClick={() => handleTabSwitch("planner")}
              >
                Week Plan
              </button>
            </div>
          )}

          {pendingClear && !selectingFor && (
            <div
              role="alertdialog"
              aria-label="Confirm clearing selections"
              className="mb-6 rounded-[8px] border border-border border-l-4 border-l-destructive bg-white p-4 shadow-sm"
            >
              <p className="font-sans text-[16px] text-primary">
                Clear your current selections? This can't be undone.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    clearSelection();
                    setPendingClear(false);
                  }}
                  variant="outline"
                  className="font-ui text-[16px] font-medium text-destructive hover:text-destructive border-red-200 hover:border-red-300 hover:bg-red-50"
                >
                  Yes, clear
                </Button>
                <Button
                  onClick={() => setPendingClear(false)}
                  variant="secondary"
                  className="font-ui text-[16px] font-medium bg-border/40 hover:bg-border text-primary"
                >
                  Keep them
                </Button>
              </div>
            </div>
          )}

          {pendingTab && !selectingFor && (
            <div
              role="alertdialog"
              aria-label="Confirm planner switch"
              className="mb-6 rounded-[8px] border border-border border-l-4 border-l-destructive bg-white p-4 shadow-sm"
            >
              <p className="font-sans text-[16px] text-primary">
                Switching planners clears your current selections.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={confirmTabSwitch}
                  variant="outline"
                  className="font-ui text-[16px] font-medium text-destructive hover:text-destructive border-red-200 hover:border-red-300 hover:bg-red-50"
                >
                  Clear & switch
                </Button>
                <Button
                  onClick={() => setPendingTab(null)}
                  variant="secondary"
                  className="font-ui text-[16px] font-medium bg-border/40 hover:bg-border text-primary"
                >
                  Stay here
                </Button>
              </div>
            </div>
          )}

          {selectingFor ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-accent/10 border border-accent/30 p-4 rounded-[12px]">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-accent">
                    Selecting {selectingFor.meal}
                  </h2>
                  <p className="font-sans text-[16px] text-accent-hover">
                    for {selectingFor.day}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectingFor(null);
                    setSearchQuery("");
                  }}
                  className="bg-white font-ui font-bold text-primary"
                >
                  Cancel
                </Button>
              </div>
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white h-12 text-[18px] border-border font-sans"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 pb-4">
                {filteredRecipes.length === 0 ? (
                  <div className="col-span-1 md:col-span-2 text-center py-10 text-muted-foreground font-sans">
                    No recipes found matching "{searchQuery}"
                  </div>
                ) : (
                  filteredRecipes.map((recipe) => (
                    <Card
                      key={recipe.url}
                      className="cursor-pointer py-0 gap-0 transition-all duration-200 border-x border-b border-border border-t-[6px] border-t-accent hover:shadow-md bg-surface rounded-[8px]"
                      onClick={() => handlePlannerSelect(recipe.url)}
                    >
                      <CardContent className="p-4 flex items-center justify-between h-full">
                        <div>
                          <h3 className="font-heading font-bold text-[18px] leading-tight text-primary">
                            {recipe.title}
                          </h3>
                        </div>
                        <Button
                          variant="ghost"
                          className="text-accent hover:bg-secondary font-ui font-bold ml-2"
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
                <h2 className="font-heading text-2xl font-bold text-primary">
                  Plan Your Week
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-ui text-destructive border-red-200 hover:bg-red-50 hover:text-destructive hover:border-red-300"
                  onClick={() => setPendingClear(true)}
                >
                  Clear Week
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="bg-white border-2 border-border rounded-[8px] shadow-sm overflow-hidden flex flex-col"
                  >
                    <div className="bg-secondary border-b border-border px-4 py-2 font-ui font-semibold text-primary">
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
                              <span className="w-20 shrink-0 font-ui font-medium text-muted-foreground uppercase tracking-wide text-[12px]">
                                {meal}
                              </span>
                              {recipe ? (
                                <span className="font-bold text-accent-deep truncate">
                                  {recipe.title}
                                </span>
                              ) : (
                                <span className="text-slate-600 italic">
                                  None
                                </span>
                              )}
                            </div>

                            {recipe ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-10 w-10 p-0 text-red-500 hover:text-white hover:bg-red-500 transition-colors text-[18px]"
                                onClick={() => removeMeal("week", day, meal)}
                                title="Remove meal"
                              >
                                &times;
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 py-0 border-accent/30 text-accent-hover hover:bg-accent/10 text-xs"
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
                <h2 className="font-heading text-2xl font-bold text-primary">
                  1-Day Plan
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingClear(true)}
                  className="font-ui text-destructive border-red-200 hover:bg-red-50 hover:text-destructive hover:border-red-300"
                >
                  Clear Day
                </Button>
              </div>
              <Card className="border-2 border-border py-0 gap-0 shadow-sm overflow-hidden">
                <CardContent className="p-0 divide-y divide-border">
                  {MEALS.map((meal) => {
                    const recipeUrl = dayPlanner[meal];
                    const recipe = recipeUrl
                      ? recipes.find((r) => r.url === recipeUrl)
                      : null;

                    return (
                      <div
                        key={meal}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 transition-colors hover:bg-secondary group"
                      >
                        <div>
                          <p className="font-semibold text-slate-500 text-sm uppercase tracking-wider mb-1">
                            {meal}
                          </p>
                          {recipe ? (
                            <p className="text-lg text-accent-deep font-bold leading-tight">
                              {recipe.title}
                            </p>
                          ) : (
                            <p className="text-base text-slate-600 italic">
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
                            className="border-accent/30 text-accent-hover hover:bg-accent/10 bg-white"
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
                <h2 className="font-heading text-2xl font-bold text-primary">
                  Quick Select
                </h2>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Input
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:max-w-xs bg-white h-10 border-border font-sans text-[16px]"
                  />
                  {selectedRecipeUrls.size > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setPendingClear(true)}
                      className="whitespace-nowrap h-10 font-ui text-destructive border-red-200 hover:bg-red-50 hover:text-destructive hover:border-red-300"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[800px] overflow-y-auto pr-2 pb-4">
                {filteredRecipes.length === 0 ? (
                  <div className="col-span-1 md:col-span-2 text-center py-10 text-muted-foreground font-sans">
                    No recipes found matching "{searchQuery}"
                  </div>
                ) : (
                  filteredRecipes.map((recipe) => {
                    const isSelected = selectedRecipeUrls.has(recipe.url);
                    return (
                      <Card
                        key={recipe.url}
                        className={`cursor-pointer py-0 gap-0 transition-all duration-200 border-x border-b border-t-[6px] border-t-accent hover:shadow-md rounded-[8px] overflow-hidden ${
                          isSelected
                            ? "border-x-accent border-b-accent bg-accent/5"
                            : "border-x-border border-b-border bg-surface"
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
                              className={`h-5 w-5 border-border ${
                                isSelected
                                  ? "data-[state=checked]:bg-accent data-[state=checked]:border-accent text-white"
                                  : ""
                              }`}
                            />
                          </div>
                          <div>
                            <h3
                              className={`font-heading font-bold text-[18px] leading-tight ${
                                isSelected ? "text-accent" : "text-primary"
                              }`}
                            >
                              {recipe.title}
                            </h3>
                            {recipe.ingredients && (
                              <p className="font-sans text-[14px] text-muted-strong mt-1">
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
        <div
          className={`lg:col-span-5 print:w-full print:block ${
            !mobileListView ? "hidden lg:block" : ""
          }`}
        >
          <div className="sticky top-24 bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col max-h-[80vh] print:max-h-max print:border-none print:shadow-none print:rounded-none">
            <button
              type="button"
              onClick={() => setMobileListView(false)}
              className="flex items-center gap-1 border-b border-border bg-white px-6 py-3 text-left font-ui text-[16px] font-medium text-accent hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent lg:hidden print:hidden"
            >
              ← Back to recipes
            </button>
            <div className="bg-secondary p-6 border-b border-border print:bg-white print:p-0 print:border-b-2 print:border-black print:pb-4 print:mb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                <h2 className="font-heading text-2xl font-bold text-primary flex items-center gap-3">
                  <span>
                    {shoppingListCreated && !finalListMinimized
                      ? "Your shopping list"
                      : "Combined ingredients"}
                  </span>
                  {selectedRecipeCount > 0 && (
                    <span className="shrink-0 whitespace-nowrap bg-accent/15 text-accent-deep text-sm py-1 px-3 rounded-full print:hidden">
                      {selectedRecipeCount}{" "}
                      {selectedRecipeCount === 1 ? "recipe" : "recipes"}
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
                      className="bg-accent hover:bg-accent-hover text-white"
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
                      <div className="mb-4 rounded-xl border border-accent/30 bg-white/95 p-3 shadow-md backdrop-blur print:hidden">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-ui text-[14px] uppercase tracking-wide text-accent">
                              Shopping list ready
                            </p>
                            <p className="font-sans text-sm text-primary">
                              {finalShoppingList.length} items selected
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFinalListMinimized(false)}
                            className="border-accent/40 text-accent hover:bg-accent/10"
                          >
                            Open
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4 rounded-2xl border border-accent/30 bg-white/95 p-4 shadow-lg backdrop-blur transition-all duration-300 motion-safe:animate-in motion-safe:slide-in-from-top-2 print:mb-0 print:rounded-none print:border-black print:shadow-none print:bg-white print:p-0">
                        <div className="flex flex-col gap-3 border-b border-border pb-4 print:border-black print:pb-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-heading text-lg font-bold text-primary">
                                Final shopping list
                              </h3>
                              <p className="text-sm text-slate-500 print:hidden">
                                Minimize to pick more ingredients, or cancel to
                                start over.
                              </p>
                            </div>
                            <span className="text-sm font-medium text-slate-500 print:hidden">
                              {finalShoppingList.length} items
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 print:hidden">
                            <div className="mr-auto flex items-center rounded-md border border-border bg-secondary p-0.5 font-ui text-[14px]">
                              <button
                                type="button"
                                onClick={() => setCondensedExport(false)}
                                aria-pressed={!condensedExport}
                                className={`rounded px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                                  !condensedExport
                                    ? "bg-white text-primary shadow-sm"
                                    : "text-muted-foreground"
                                }`}
                              >
                                With amounts
                              </button>
                              <button
                                type="button"
                                onClick={() => setCondensedExport(true)}
                                aria-pressed={condensedExport}
                                className={`rounded px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                                  condensedExport
                                    ? "bg-white text-primary shadow-sm"
                                    : "text-muted-foreground"
                                }`}
                              >
                                Just items
                              </button>
                            </div>
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
                              className="bg-accent text-white hover:bg-accent-hover"
                              disabled={finalShoppingList.length === 0}
                            >
                              Print
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFinalListMinimized(true)}
                              className="text-slate-600 hover:bg-slate-100"
                            >
                              Minimize
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelShoppingList}
                              className="text-destructive hover:bg-red-50 hover:text-destructive"
                            >
                              Cancel list
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
                              className="h-11 bg-white text-[16px] border-border font-sans"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="h-11 shrink-0 border-accent/30 text-accent-hover hover:bg-accent/10"
                              onClick={addCustomItem}
                            >
                              Add
                            </Button>
                          </div>

                          {finalShoppingList.length === 0 ? (
                            <div className="mt-3 rounded-xl border border-dashed border-border p-4 text-sm text-slate-500 print:border-black print:text-black">
                              Select ingredients below or add custom items here.
                            </div>
                          ) : (
                            <ul className="mt-3 max-h-[320px] space-y-3 overflow-y-auto pr-1 print:mt-2 print:max-h-max print:space-y-2 print:overflow-visible print:pr-0">
                              {finalDisplayList.map((entry, id) => (
                                <li
                                  key={entry.key}
                                  className="flex items-start gap-3 rounded-xl border border-border p-3 print:border-black print:rounded-none print:p-0 print:border-0"
                                >
                                  <Checkbox
                                    id={`cart-${id}`}
                                    checked
                                    onCheckedChange={() =>
                                      removeDisplayEntry(entry)
                                    }
                                    className="mt-1 h-5 w-5 shrink-0 print:hidden"
                                  />
                                  <div className="hidden print:block w-5 h-5 border-2 border-black rounded-sm mt-1 shrink-0"></div>
                                  <label
                                    htmlFor={`cart-${id}`}
                                    className="grid flex-1 cursor-pointer gap-1.5"
                                  >
                                    <span className="text-base font-medium leading-snug text-primary print:text-black print:text-xl">
                                      {entry.label}
                                    </span>
                                    {!condensedExport &&
                                      (entry.custom ? (
                                        <span className="text-xs uppercase tracking-wide text-slate-600 print:text-slate-700">
                                          Added manually
                                        </span>
                                      ) : (
                                        <span className="text-sm text-slate-500 print:text-slate-800">
                                          From recipes: {entry.recipeTitle}
                                        </span>
                                      ))}
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

                {(!shoppingListCreated || finalListMinimized) && (
                <section className="space-y-3 print:hidden">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">
                        Select the ingredients you need, then create the
                        shopping list.
                      </p>
                      {!shoppingListCreated &&
                        selectedIngredientCount === 0 &&
                        shoppingList.length > 0 && (
                          <p className="mt-1 text-xs font-medium text-accent">
                            Select at least one ingredient to enable "Create
                            shopping list".
                          </p>
                        )}
                    </div>
                    <span className="text-sm font-medium text-slate-500">
                      {shoppingList.length} items
                    </span>
                  </div>

                  {shoppingList.length > 0 && (
                    <div className="rounded-xl border border-border bg-secondary p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-ui text-[14px] uppercase tracking-wide text-muted-strong">
                            Selection progress
                          </p>
                          <p className="font-sans text-sm text-primary">
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
                            className="border-divider bg-white"
                          >
                            Select all
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearIngredientSelection}
                            disabled={selectedIngredientCount === 0}
                            className="bg-white text-destructive border-red-200 hover:bg-red-50 hover:text-destructive hover:border-red-300"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-accent transition-all duration-300"
                          style={{ width: `${selectionProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {shoppingList.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-sm text-slate-500">
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
                                ? "border-accent/30 bg-accent/10"
                                : "border-border hover:bg-secondary"
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
                              <span className="text-base font-medium leading-snug text-primary">
                                {item.text}
                              </span>
                              <span className="text-sm text-slate-500">
                                Used in: {item.recipeTitle}
                              </span>
                              {item.originals && item.originals.length > 0 && (
                                <span className="text-xs text-slate-500">
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
                )}
              </div>
            </div>
            {shoppingListCreated && finalShoppingList.length > 0 && (
              <div className="p-4 border-t border-border bg-secondary text-center print:hidden">
                <p className="text-sm text-slate-500">
                  {finalShoppingList.length} total items
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-only: jump straight to the ingredients panel once something
          is selected, instead of scrolling past the whole recipe list. */}
      {!mobileListView && totalItemsSelectedCount > 0 && (
        <div className="fixed inset-x-4 bottom-20 z-30 lg:hidden print:hidden">
          <Button
            onClick={() => setMobileListView(true)}
            className="h-14 w-full rounded-[12px] bg-accent font-ui text-[18px] font-bold text-white shadow-lg hover:bg-accent-hover"
          >
            View ingredients ({selectedRecipeCount}{" "}
            {selectedRecipeCount === 1 ? "recipe" : "recipes"}) →
          </Button>
        </div>
      )}
    </div>
  );
}
