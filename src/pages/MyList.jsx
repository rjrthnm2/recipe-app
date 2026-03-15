import { useRecipes } from "../hooks/useRecipes";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function MyList() {
  const { recipes, savedIds } = useRecipes();

  // Filter the master list to only show saved recipes
  const favoriteRecipes = recipes.filter((r) => savedIds.includes(r.url));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">My Saved Recipes</h1>

      {favoriteRecipes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-zinc-300 bg-card py-20 text-center">
          <p className="text-lg text-zinc-700">
            You haven't saved any recipes yet!
          </p>
          <Button asChild variant="link">
            <Link to="/">Go browse some recipes</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteRecipes.map((recipe, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{recipe.title}</CardTitle>
                <p className="text-base text-zinc-700">{recipe.prep_time}</p>
              </CardHeader>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link to={`/recipe/${recipe.url.split("/").pop()}`}>
                    View Recipe
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
