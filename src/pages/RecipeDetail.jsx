import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useRecipes } from "../hooks/useRecipes";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

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

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperuser =
    user?.email &&
    ["robinzjephthah@gmail.com", "maureenpeck1412@gmail.com"].includes(
      user.email,
    );

  const { recipes, toggleSave, savedIds, loading, updateRecipe, deleteRecipe } =
    useRecipes();

  // Recipe states
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [checkedIngredients, setCheckedIngredients] = useState({});

  // Edit/Delete states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [deleteStep, setDeleteStep] = useState(0);

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
    setEditForm({
      ...recipe,
      tags: recipe.tags ? recipe.tags.map((t) => t.replace(/[()]/g, "")) : [],
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (updateRecipe) {
      const updated = {
        ...editForm,
        tags: editForm.tags.map((t) =>
          t.trim().startsWith("(") ? t.trim() : `(${t.trim()})`,
        ),
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
      <Link to="/" className="text-base text-zinc-700 hover:text-zinc-950">
        ← Back to Browse
      </Link>

      {/* Superuser controls */}
      {isSuperuser && (
        <div className="flex flex-wrap gap-3 p-4 bg-zinc-100 rounded-lg shadow-sm border border-zinc-200">
          <div className="w-full text-sm font-semibold text-zinc-600 mb-2">
            Superuser Controls
          </div>
          {!isEditing ? (
            <Button onClick={handleEditClick} variant="default">
              Edit Recipe
            </Button>
          ) : (
            <>
              <Button onClick={handleSaveEdit} variant="default">
                Save Edits
              </Button>
              <Button onClick={handleCancelEdit} variant="secondary">
                Cancel
              </Button>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            {deleteStep > 0 && (
              <Button onClick={handleDeleteCancel} variant="outline" size="sm">
                Cancel Delete
              </Button>
            )}
            <Button
              onClick={handleDeleteClick}
              variant={deleteStep > 0 ? "destructive" : "outline"}
              className={
                deleteStep === 0
                  ? "text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                  : "flex items-center text-lg py-6 font-bold"
              }
              aria-label="Delete recipe"
            >
              <TrashIcon
                className={deleteStep > 0 ? "w-6 h-6 mr-2" : "w-4 h-4 mr-2"}
              />
              {deleteStep === 0
                ? "Delete Recipe"
                : deleteStep === 1
                  ? "Are you sure?"
                  : "Are you sure sure?"}
            </Button>
          </div>
        </div>
      )}

      {/* Title block */}
      <div className="space-y-4">
        {isEditing ? (
          <Input
            value={currentData.title}
            onChange={(e) =>
              setEditForm({ ...editForm, title: e.target.value })
            }
            className="text-4xl font-bold p-6 font-sans border-zinc-300 bg-white"
            placeholder="Recipe Title"
          />
        ) : (
          <h1 className="text-4xl font-bold tracking-tight">
            {currentData.title}
          </h1>
        )}

        {isEditing ? (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-600">Tags</label>
            <div className="flex flex-wrap gap-2">
              {currentData.tags?.map((tag, i) => (
                <div key={`tag-${i}`} className="flex items-center gap-1">
                  <Input
                    value={tag}
                    onChange={(e) =>
                      handleArrayChange("tags", i, e.target.value)
                    }
                    className="w-32 bg-white"
                    placeholder="Tag"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500"
                    onClick={() => handleRemoveArrayItem("tags", i)}
                  >
                    &times;
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddArrayItem("tags")}
              >
                + Add Tag
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {currentData.tags?.map((tag, i) => (
              <Badge key={i} variant="outline">
                {tag.replace(/[()]/g, "")}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-base text-zinc-800 items-center">
          {isEditing ? (
            <>
              <div className="flex items-center gap-2">
                <Input
                  value={currentData.prep_time}
                  onChange={(e) =>
                    setEditForm({ ...editForm, prep_time: e.target.value })
                  }
                  className="w-24 bg-white"
                  placeholder="Prep time"
                />{" "}
                <span className="text-sm text-zinc-500">Prep</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={currentData.cook_time}
                  onChange={(e) =>
                    setEditForm({ ...editForm, cook_time: e.target.value })
                  }
                  className="w-24 bg-white"
                  placeholder="Cook time"
                />{" "}
                <span className="text-sm text-zinc-500">Cook</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={currentData.servings}
                  onChange={(e) =>
                    setEditForm({ ...editForm, servings: e.target.value })
                  }
                  className="w-24 bg-white"
                  placeholder="Servings"
                />{" "}
                <span className="text-sm text-zinc-500">Servings</span>
              </div>
            </>
          ) : (
            <>
              <span>{currentData.prep_time} Prep</span>
              <span>{currentData.cook_time} Cook</span>
              <span>{currentData.servings} Servings</span>
            </>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => toggleSave(recipe.url)}
            variant={isSaved ? "secondary" : "default"}
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
      )}

      {shareMessage && (
        <p role="status" className="text-base text-zinc-700">
          {shareMessage}
        </p>
      )}

      {(currentData.author_note || isEditing) && (
        <div className="rounded-xl border border-zinc-200 bg-amber-50 p-5 italic text-zinc-800">
          {isEditing ? (
            <Textarea
              value={currentData.author_note || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, author_note: e.target.value })
              }
              className="w-full bg-white/50 border-amber-200 min-h-[100px]"
              placeholder="Author's note..."
            />
          ) : (
            `"${currentData.author_note}"`
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <h2 className="text-2xl font-semibold">Ingredients</h2>
          <ul className="space-y-3">
            {isEditing ? (
              <div className="space-y-2">
                {currentData.ingredients.map((ing, i) => (
                  <div key={i} className="flex gap-2">
                    <Textarea
                      value={ing}
                      onChange={(e) =>
                        handleArrayChange("ingredients", i, e.target.value)
                      }
                      className="bg-white min-h-[60px]"
                      placeholder="Ingredient"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 h-10 w-10 shrink-0"
                      onClick={() => handleRemoveArrayItem("ingredients", i)}
                    >
                      &times;
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleAddArrayItem("ingredients")}
                >
                  + Add Ingredient
                </Button>
              </div>
            ) : (
              currentData.ingredients.map((ing, i) => (
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
              ))
            )}
          </ul>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h2 className="text-2xl font-semibold">Directions</h2>
          <ol className="space-y-6">
            {isEditing ? (
              <div className="space-y-4">
                {currentData.directions.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span className="text-3xl font-bold leading-none text-zinc-400 mt-2">
                      {i + 1}
                    </span>
                    <div className="flex-1 flex gap-2">
                      <Textarea
                        value={step}
                        onChange={(e) =>
                          handleArrayChange("directions", i, e.target.value)
                        }
                        className="bg-white min-h-[100px] text-lg"
                        placeholder="Step description"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 h-10 w-10 shrink-0"
                        onClick={() => handleRemoveArrayItem("directions", i)}
                      >
                        &times;
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => handleAddArrayItem("directions")}
                >
                  + Add Step
                </Button>
              </div>
            ) : (
              currentData.directions.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-4 border-b border-zinc-200 pb-5 last:border-b-0"
                >
                  <span className="text-3xl font-bold leading-none text-zinc-700">
                    {i + 1}
                  </span>
                  <p className="text-lg leading-relaxed text-zinc-900">
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
