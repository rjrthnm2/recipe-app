import { useRecipes } from "../hooks/useRecipes";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favoriteRecipes.map((recipe, index) => {
            const recipeId = recipe.url.split("/").pop();

            return (
              <Card
                key={recipe.url || index}
                className="reveal-card flex h-full flex-col border-zinc-200 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <CardHeader>
                  <CardTitle className="line-clamp-2 text-xl">
                    {recipe.title}
                  </CardTitle>
                  <p className="text-base text-zinc-700">
                    Prep: {recipe.prep_time || "N/A"}
                  </p>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex flex-wrap gap-2">
                    {recipe.tags?.map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag.replace(/[()]/g, "")}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link to={`/recipe/${recipeId}`}>View Recipe</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
