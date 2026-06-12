import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useRecipes } from "../hooks/useRecipes";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import IngredientsEditor from "../components/IngredientsEditor";
import {
  formatIngredient,
  normalizeIngredient,
  collectIngredientNames,
} from "../lib/units";

// Simple Trash Icon SVG
function TrashIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m5 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
    </svg>
  );
}

// Simple Pencil Icon SVG
function PencilIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
  );
}

// Build editable form state from a recipe (legacy or structured).
function toEditForm(recipe) {
  return {
    ...recipe,
    tags: recipe.tags ? recipe.tags.map((t) => t.replace(/[()]/g, "")) : [],
    // Convert ingredients (legacy strings or structured) to editable rows.
    ingredients: (recipe.ingredients || []).map(normalizeIngredient),
  };
}

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin: isSuperuser } = useAuth();

  const { recipes, toggleSave, savedIds, loading, updateRecipe, deleteRecipe } =
    useRecipes();
  const ingredientNames = useMemo(
    () => collectIngredientNames(recipes),
    [recipes],
  );

  // Recipe states
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [checkedIngredients, setCheckedIngredients] = useState({});

  // Edit/Delete states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [deleteStep, setDeleteStep] = useState(0);

  // ?edit=1 (e.g. the pencil button on My List) opens the editor directly
  // once the recipe and superuser status have loaded. Guarded setState during
  // render per https://react.dev/learn/you-might-not-need-an-effect
  const wantsEdit = searchParams.get("edit") === "1";
  if (wantsEdit && !loading && isSuperuser && !isEditing && !editForm) {
    const target = recipes.find((r) => r.url.endsWith(id));
    if (target) {
      setIsEditing(true);
      setEditForm(toEditForm(target));
    }
  }

  // Consume the param once the editor is open so refresh doesn't reopen it.
  useEffect(() => {
    if (!wantsEdit || !isEditing) return;
    const next = new URLSearchParams(searchParams);
    next.delete("edit");
    setSearchParams(next, { replace: true });
  }, [wantsEdit, isEditing, searchParams, setSearchParams]);

  if (loading)
    return (
      <div className="p-8 text-center text-zinc-500">Loading recipe...</div>
    );

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

  // Superuser actions
  const handleEditClick = () => {
    setIsEditing(true);
    setEditForm(toEditForm(recipe));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (updateRecipe) {
      const updated = {
        ...editForm,
        tags: editForm.tags
          .map((t) => t.trim())
          .filter((t) => t !== "")
          .map((t) => (t.startsWith("(") ? t : `(${t})`)),
        // Drop empty ingredient rows and tidy the rest.
        ingredients: (editForm.ingredients || [])
          .filter((ing) => (ing.name || "").trim() !== "")
          .map((ing) => ({
            quantity: (ing.quantity || "").trim(),
            unit: ing.unit || "",
            name: ing.name.trim(),
            note: (ing.note || "").trim(),
          })),
      };
      await updateRecipe(recipe.url, updated);
    }
    setIsEditing(false);
    setEditForm(null);
  };

  const handleDeleteClick = async () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
    } else if (deleteStep === 1) {
      setDeleteStep(2);
    } else if (deleteStep === 2) {
      if (deleteRecipe) {
        await deleteRecipe(recipe.url);
      }
      navigate("/");
    }
  };

  const handleDeleteCancel = () => {
    setDeleteStep(0);
  };

  const handleArrayChange = (field, index, value) => {
    const updatedArray = [...editForm[field]];
    updatedArray[index] = value;
    setEditForm({ ...editForm, [field]: updatedArray });
  };

  const handleAddArrayItem = (field) => {
    setEditForm({ ...editForm, [field]: [...editForm[field], ""] });
  };

  const handleRemoveArrayItem = (field, index) => {
    const updatedArray = [...editForm[field]];
    updatedArray.splice(index, 1);
    setEditForm({ ...editForm, [field]: updatedArray });
  };

  const currentData = isEditing ? editForm : recipe;

  return (
    <article className="mx-auto max-w-4xl space-y-8 pb-20">
      <Link
        to="/"
        className="font-ui text-[16px] text-[#0F172A]/70 hover:text-[#2596be]"
      >
        ← Back to Browse
      </Link>

      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-4 flex-1">
          {isEditing ? (
            <Input
              value={currentData.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
              className="text-4xl font-bold p-6 font-heading border-[#e2e8f0] bg-white text-[#0F172A]"
              placeholder="Recipe Title"
            />
          ) : (
            <div className="flex items-start gap-3">
              <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mt-2 text-[#0F172A]">
                {currentData.title}
              </h1>
              <button
                type="button"
                onClick={() => toggleSave(recipe.url)}
                aria-label={
                  isSaved ? "Remove from My List" : "Save to My List"
                }
                aria-pressed={isSaved}
                title={isSaved ? "Remove from My List" : "Save to My List"}
                className="relative mt-2 shrink-0 rounded-full p-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2596be]"
              >
                {isSaved && (
                  <svg
                    key="glow"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="#2596be"
                    className="heart-glow pointer-events-none absolute left-2 top-2 h-9 w-9"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                )}
                <svg
                  key={isSaved ? "saved" : "unsaved"}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={isSaved ? "#2596be" : "none"}
                  stroke="#2596be"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={`h-9 w-9 ${isSaved ? "heart-pop" : ""}`}
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Superuser actions */}
        {isSuperuser && (
          <div className="flex flex-wrap items-center justify-end gap-3 mt-2 md:mt-3.5 border-[#e2e8f0]">
            {!isEditing ? (
              <Button
                onClick={handleEditClick}
                variant="outline"
                className="flex items-center text-[18px] py-6 px-4 font-ui font-medium border-[#e2e8f0] hover:bg-[#F8FAFC] text-[#0F172A]"
              >
                <PencilIcon className="w-5 h-5 mr-2" />
                Edit Recipe
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleSaveEdit}
                  variant="default"
                  className="flex items-center text-[18px] py-6 px-4 font-ui font-bold bg-[#2596be] hover:bg-[#2596be]/90 text-white"
                >
                  Save Edits
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="secondary"
                  className="flex items-center text-[18px] py-6 px-4 font-ui font-medium bg-[#e2e8f0]/40 hover:bg-[#e2e8f0] text-[#0F172A]"
                >
                  Cancel
                </Button>
              </>
            )}

            <div className="flex items-center gap-2">
              {deleteStep > 0 && (
                <Button
                  onClick={handleDeleteCancel}
                  variant="outline"
                  className="text-[18px] py-6 px-4 font-ui font-medium border-[#e2e8f0] text-[#0F172A]"
                >
                  Cancel Delete
                </Button>
              )}
              <Button
                onClick={handleDeleteClick}
                variant={deleteStep > 0 ? "destructive" : "outline"}
                className={
                  deleteStep === 0
                    ? "flex items-center text-[18px] py-6 px-4 text-[#dc2626] hover:text-[#dc2626] hover:bg-red-50 border-red-200 hover:border-red-300 font-ui font-medium"
                    : "flex items-center text-[18px] py-6 px-4 font-ui font-medium bg-[#dc2626] text-white hover:bg-[#dc2626]/90"
                }
                aria-label="Delete recipe"
              >
                <TrashIcon className="w-6 h-6 mr-2" />
                {deleteStep === 0
                  ? "Delete Recipe"
                  : deleteStep === 1
                    ? "Are you sure?"
                    : "Are you sure sure?"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <label className="text-[16px] font-sans font-semibold text-[#0F172A]/70">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {currentData.tags?.map((tag, i) => (
                <div key={`tag-${i}`} className="flex items-center gap-1">
                  <Input
                    value={tag}
                    onChange={(e) =>
                      handleArrayChange("tags", i, e.target.value)
                    }
                    className="w-32 bg-white border-[#e2e8f0] font-sans"
                    placeholder="Tag"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-[#dc2626] hover:bg-red-50"
                    onClick={() => handleRemoveArrayItem("tags", i)}
                  >
                    &times;
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="font-ui border-[#e2e8f0] text-[#0F172A]"
                onClick={() => handleAddArrayItem("tags")}
              >
                + Add Tag
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {currentData.tags?.map((tag, i) => (
              <Badge
                key={i}
                variant="outline"
                className="border-[#e2e8f0] text-[#0F172A]/80 font-ui text-[14px] px-3 py-1 font-medium rounded-full bg-[#F8FAFC]"
              >
                {tag.replace(/[()]/g, "")}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-[16px] text-[#64748b] items-center font-sans tracking-wide">
          {isEditing ? (
            <>
              <div className="flex items-center gap-2">
                <Input
                  value={currentData.prep_time}
                  onChange={(e) =>
                    setEditForm({ ...editForm, prep_time: e.target.value })
                  }
                  className="w-24 bg-white border-[#e2e8f0]"
                  placeholder="Prep time"
                />{" "}
                <span className="text-[14px] text-[#64748b]">Prep</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={currentData.cook_time}
                  onChange={(e) =>
                    setEditForm({ ...editForm, cook_time: e.target.value })
                  }
                  className="w-24 bg-white border-[#e2e8f0]"
                  placeholder="Cook time"
                />{" "}
                <span className="text-[14px] text-[#64748b]">Cook</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={currentData.servings}
                  onChange={(e) =>
                    setEditForm({ ...editForm, servings: e.target.value })
                  }
                  className="w-24 bg-white border-[#e2e8f0]"
                  placeholder="Servings"
                />{" "}
                <span className="text-[14px] text-[#64748b]">Servings</span>
              </div>
            </>
          ) : (
            <>
              {[
                currentData.prep_time && `${currentData.prep_time} Prep`,
                currentData.cook_time && `${currentData.cook_time} Cook`,
                currentData.servings && `${currentData.servings} Servings`,
              ]
                .filter(Boolean)
                .map((part, i) => (
                  <span key={part} className="flex items-center gap-4">
                    {i > 0 && <span className="opacity-50">•</span>}
                    <span>{part}</span>
                  </span>
                ))}
              {(currentData.prep_time ||
                currentData.cook_time ||
                currentData.servings) && <span className="opacity-50">•</span>}
              {/* Recipes without an owner predate ownership — all Jewel's. */}
              <span className="font-medium text-[#2596be]">
                by {recipe.ownerName || "Jewel"}
              </span>
            </>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => toggleSave(recipe.url)}
            variant={isSaved ? "secondary" : "default"}
            className={
              isSaved
                ? "font-ui text-[16px] font-bold bg-[#e2e8f0]/40 text-[#0F172A] hover:bg-[#e2e8f0]"
                : "font-ui text-[16px] font-bold bg-[#2596be] text-white hover:bg-[#2596be]/90"
            }
            aria-label={
              isSaved
                ? "Remove recipe from saved list"
                : "Save recipe to my list"
            }
          >
            {isSaved ? "Saved" : "Save to My List"}
          </Button>

          <Button
            onClick={copyLink}
            variant="outline"
            className="font-ui text-[16px] font-medium border-[#e2e8f0] text-[#0F172A] hover:bg-[#F8FAFC]"
            aria-label="Copy recipe link"
          >
            {copied ? "Copied" : "Copy Link"}
          </Button>

          <Button
            asChild
            variant="outline"
            className="font-ui text-[16px] font-medium border-[#e2e8f0] text-[#0F172A] hover:bg-[#F8FAFC]"
            aria-label="Share recipe by email"
          >
            <a href={`mailto:?subject=${encodedTitle}&body=${encodedBody}`}>
              Email Recipe
            </a>
          </Button>

          <Button
            onClick={() => window.print()}
            variant="outline"
            className="font-ui text-[16px] font-medium border-[#e2e8f0] text-[#0F172A] hover:bg-[#F8FAFC]"
            aria-label="Print recipe"
          >
            Print Recipe
          </Button>
        </div>
      )}

      {shareMessage && (
        <p role="status" className="font-sans text-[18px] text-[#2596be]">
          {shareMessage}
        </p>
      )}

      {(currentData.author_note || isEditing) && (
        <div className="rounded-[8px] border-l-4 border-l-[#2596be] bg-[#F8FAFC] p-6 italic font-sans text-[20px] text-[#0F172A]/80 shadow-sm">
          {isEditing ? (
            <Textarea
              value={currentData.author_note || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, author_note: e.target.value })
              }
              className="w-full bg-white border-[#e2e8f0] min-h-[100px] not-italic font-sans text-[18px]"
              placeholder="Author's note..."
            />
          ) : (
            `"${currentData.author_note}"`
          )}
        </div>
      )}

      {/* The structured ingredients editor needs full width, so edit mode
          stacks the sections instead of using the 1/3 + 2/3 columns. */}
      <div className={isEditing ? "space-y-12" : "grid md:grid-cols-3 gap-10"}>
        <div className={isEditing ? "space-y-6" : "md:col-span-1 space-y-6"}>
          <h2 className="font-heading text-3xl font-semibold text-[#0F172A] border-b border-[#e2e8f0] pb-2">
            Ingredients
          </h2>
          {isEditing ? (
            <IngredientsEditor
              value={currentData.ingredients}
              onChange={(ingredients) =>
                setEditForm({ ...editForm, ingredients })
              }
              suggestions={ingredientNames}
            />
          ) : (
            <ul className="space-y-4">
              {currentData.ingredients.map((ing, i) => {
                const text = formatIngredient(ing);
                return (
                  <li
                    key={i}
                    className="flex items-start gap-4 font-sans text-[18px] text-[#0F172A] p-2 hover:bg-[#F8FAFC] rounded-[8px] transition-colors"
                  >
                    <Checkbox
                      id={`ingredient-${i}`}
                      checked={Boolean(checkedIngredients[i])}
                      onCheckedChange={() => toggleIngredientCheck(i)}
                      aria-label={`Mark ingredient as prepared: ${text}`}
                      className="mt-1 h-5 w-5 border-[#e2e8f0] data-[state=checked]:bg-[#2596be] data-[state=checked]:border-[#2596be]"
                    />
                    <label
                      htmlFor={`ingredient-${i}`}
                      className={`cursor-pointer leading-relaxed ${checkedIngredients[i] ? "line-through text-[#64748b]" : ""}`}
                    >
                      {text}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className={isEditing ? "space-y-6" : "md:col-span-2 space-y-6"}>
          <h2 className="font-heading text-3xl font-semibold text-[#0F172A] border-b border-[#e2e8f0] pb-2">
            Directions
          </h2>
          <ol className="space-y-6">
            {isEditing ? (
              <div className="space-y-6">
                {currentData.directions.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span className="font-heading text-3xl font-bold leading-none text-[#64748b] mt-2">
                      {i + 1}
                    </span>
                    <div className="flex-1 flex gap-2">
                      <Textarea
                        value={step}
                        onChange={(e) =>
                          handleArrayChange("directions", i, e.target.value)
                        }
                        className="bg-white min-h-[100px] font-sans text-[18px] border-[#e2e8f0]"
                        placeholder="Step description"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-[#dc2626] h-10 w-10 shrink-0 hover:bg-red-50"
                        onClick={() => handleRemoveArrayItem("directions", i)}
                      >
                        &times;
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-4 font-ui text-[#0F172A] border-[#e2e8f0]"
                  onClick={() => handleAddArrayItem("directions")}
                >
                  + Add Step
                </Button>
              </div>
            ) : (
              currentData.directions.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-5 border-b border-[#e2e8f0] pb-6 last:border-b-0"
                >
                  <span className="font-heading text-4xl font-bold leading-none text-[#2596be] opacity-80 mt-1">
                    {i + 1}
                  </span>
                  <p className="font-sans text-[20px] leading-[1.7] text-[#0F172A]">
                    {step}
                  </p>
                </li>
              ))
            )}
          </ol>
        </div>
      </div>
    </article>
  );
}
