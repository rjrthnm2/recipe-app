import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecipes } from "../hooks/useRecipes";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";

export default function AddRecipe() {
  const { addRecipe } = useRecipes();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    author_note: "",
    prep_time: "",
    cook_time: "",
    servings: "",
    tags: "",
    ingredients: "",
    directions: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Process the "one per line" text into arrays like the JSON format
    const newRecipe = {
      ...formData,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== "")
        .map((t) => (t.startsWith("(") ? t : `(${t})`)),
      ingredients: formData.ingredients
        .split("\n")
        .filter((line) => line.trim() !== ""),
      directions: formData.directions
        .split("\n")
        .filter((line) => line.trim() !== ""),
    };

    const newId = await addRecipe(newRecipe);
    if (newId) {
      // Need to use replace: true so going "back" goes to home screen instead of form
      navigate(`/recipe/${newId}`, { replace: true });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-20">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0F172A]">
        Add New Recipe
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="title"
            className="font-sans text-[16px] text-[#0F172A]"
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
            className="border-[#e2e8f0] font-sans text-[16px] h-12"
            placeholder="e.g. Grandma's Famous Chili"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor="prep"
              className="font-sans text-[16px] text-[#0F172A]"
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
              className="border-[#e2e8f0] font-sans text-[16px] h-12"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="cook"
              className="font-sans text-[16px] text-[#0F172A]"
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
              className="border-[#e2e8f0] font-sans text-[16px] h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="tags"
            className="font-sans text-[16px] text-[#0F172A]"
          >
            Tags (comma separated)
          </Label>
          <Input
            id="tags"
            placeholder="Ground beef, Quick, Dinner"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="border-[#e2e8f0] font-sans text-[16px] h-12"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="ingredients"
            className="font-sans text-[16px] text-[#0F172A]"
          >
            Ingredients (one per line)
          </Label>
          <Textarea
            id="ingredients"
            required
            className="min-h-[180px] border-[#e2e8f0] font-sans text-[16px]"
            placeholder="1 lb ground beef&#10;1 can tomato sauce"
            value={formData.ingredients}
            onChange={(e) =>
              setFormData({ ...formData, ingredients: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="directions"
            className="font-sans text-[16px] text-[#0F172A]"
          >
            Directions (one per line)
          </Label>
          <Textarea
            id="directions"
            required
            className="min-h-[180px] border-[#e2e8f0] font-sans text-[16px]"
            placeholder="Brown the beef&#10;Add the sauce and simmer"
            value={formData.directions}
            onChange={(e) =>
              setFormData({ ...formData, directions: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="note"
            className="font-sans text-[16px] text-[#0F172A]"
          >
            Author Note (Optional)
          </Label>
          <Input
            id="note"
            value={formData.author_note}
            onChange={(e) =>
              setFormData({ ...formData, author_note: e.target.value })
            }
            className="border-[#e2e8f0] font-sans text-[16px] h-12"
          />
        </div>

        <Button
          type="submit"
          className="w-full text-[18px] bg-[#0D9488] hover:bg-[#0D9488]/90 text-white font-ui font-bold h-14 rounded-[8px] transition-colors mt-6"
        >
          Save Recipe
        </Button>
      </form>
    </div>
  );
}
