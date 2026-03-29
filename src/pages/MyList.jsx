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
      <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0F172A]">
        My Saved Recipes
      </h1>

      {favoriteRecipes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[#e2e8f0] bg-[#F8FAFC] py-20 text-center">
          <p className="text-[18px] text-[#0F172A]/70 font-sans">
            You haven't saved any recipes yet!
          </p>
          <Button
            asChild
            variant="link"
            className="font-ui text-[#0D9488] hover:text-[#0F172A]"
          >
            <Link to="/">Go browse some recipes</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {favoriteRecipes.map((recipe, index) => {
            const recipeId = recipe.url.split("/").pop();

            return (
              <Card
                key={recipe.url || index}
                className="reveal-card flex h-full flex-col bg-[#FAFAFA] border-t-[6px] border-t-[#0D9488] border-x-[#e2e8f0] border-b-[#e2e8f0] border-x border-b shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md rounded-[8px] overflow-hidden"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="font-heading line-clamp-2 text-[20px] font-bold text-[#0F172A] leading-tight mb-1">
                    {recipe.title}
                  </CardTitle>
                  <div className="flex items-center text-[14px] text-[#64748b] font-sans">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinelinejoin="round"
                      className="mr-1.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Prep: {recipe.prep_time || "N/A"}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow p-4 pt-0">
                  <div className="border-t border-dashed border-[#cbd5e1] w-full my-2"></div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {recipe.tags?.map((tag, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-white text-[#0F172A]/70 border border-[#e2e8f0] font-ui text-[12px] px-2 py-0.5 font-medium rounded-sm"
                      >
                        {tag.replace(/[()]/g, "")}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    className="w-full bg-[#0F172A] hover:bg-[#0D9488] text-white font-ui font-medium text-[16px] h-10 rounded-[6px] transition-colors"
                    asChild
                  >
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
