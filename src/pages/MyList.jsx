import { useRecipes } from "../hooks/useRecipes";
import { Link } from "react-router-dom";
import LoadErrorNotice from "../components/LoadErrorNotice";
import usePageTitle from "../hooks/usePageTitle";
import RecipeCard from "../components/RecipeCard";
import { Button } from "../components/ui/button";

export default function MyList() {
  usePageTitle("My List");
  const { recipes, savedIds, loading, loadError, canManageRecipe } =
    useRecipes();

  // Filter the master list to only show saved recipes
  const favoriteRecipes = recipes.filter((r) => savedIds.includes(r.url));

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-primary">
        My Saved Recipes
      </h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-[8px] border border-border border-t-[6px] border-t-divider bg-secondary"
            />
          ))}
        </div>
      ) : loadError ? (
        <LoadErrorNotice />
      ) : favoriteRecipes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-secondary py-20 text-center">
          <p className="text-[18px] text-primary/70 font-sans">
            You haven't saved any recipes yet!
          </p>
          <Button
            asChild
            variant="link"
            className="font-ui text-accent hover:text-primary"
          >
            <Link to="/">Go browse some recipes</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {favoriteRecipes.map((recipe, index) => (
            <RecipeCard
              key={recipe.url || index}
              recipe={recipe}
              index={index}
              showEdit={canManageRecipe(recipe)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
