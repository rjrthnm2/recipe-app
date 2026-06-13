import { useRecipes } from "../hooks/useRecipes";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import LoadErrorNotice from "../components/LoadErrorNotice";
import usePageTitle from "../hooks/usePageTitle";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

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

export default function MyList() {
  usePageTitle("My List");
  const { recipes, savedIds, loading, loadError } = useRecipes();
  const { isAdmin: isSuperuser } = useAuth();

  // Filter the master list to only show saved recipes
  const favoriteRecipes = recipes.filter((r) => savedIds.includes(r.url));

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0F172A]">
        My Saved Recipes
      </h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-[8px] border border-[#e2e8f0] border-t-[6px] border-t-[#cbd5e1] bg-[#F8FAFC]"
            />
          ))}
        </div>
      ) : loadError ? (
        <LoadErrorNotice />
      ) : favoriteRecipes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[#e2e8f0] bg-[#F8FAFC] py-20 text-center">
          <p className="text-[18px] text-[#0F172A]/70 font-sans">
            You haven't saved any recipes yet!
          </p>
          <Button
            asChild
            variant="link"
            className="font-ui text-[#2596be] hover:text-[#0F172A]"
          >
            <Link to="/">Go browse some recipes</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {favoriteRecipes.map((recipe, index) => {
            const recipeId = recipe.url; // url IS the document id

            return (
              <Card
                key={recipe.url || index}
                size="sm"
                className="reveal-card flex h-full flex-col gap-2 py-3 bg-[#FAFAFA] border-t-[6px] border-t-[#2596be] border-x-[#e2e8f0] border-b-[#e2e8f0] border-x border-b shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md rounded-[8px] overflow-hidden"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <CardHeader className="pb-0">
                  <CardTitle className="font-heading line-clamp-2 text-[18px] md:text-[20px] font-bold text-[#0F172A] leading-tight">
                    {recipe.title}
                  </CardTitle>
                </CardHeader>
                {/* mt-auto anchors prep + divider + tags just above the button,
                    so they line up across cards no matter the title length. */}
                <CardContent className="mt-auto pt-0">
                  {recipe.prep_time && (
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
                        strokeLinejoin="round"
                        className="mr-1.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>Prep: {recipe.prep_time}</span>
                    </div>
                  )}
                  <div className="border-t border-dashed border-[#cbd5e1] w-full my-1.5"></div>
                  <div className="flex flex-nowrap items-center gap-1.5 mt-1.5 overflow-hidden">
                    {recipe.tags?.slice(0, 2).map((tag, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="whitespace-nowrap bg-white text-[#0F172A]/70 border border-[#e2e8f0] font-ui text-[12px] px-2 py-0.5 font-medium rounded-sm"
                      >
                        {tag.replace(/[()]/g, "")}
                      </Badge>
                    ))}
                    {(recipe.tags?.length || 0) > 2 && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 bg-[#F8FAFC] text-[#475569] border border-[#e2e8f0] font-ui text-[12px] px-2 py-0.5 font-medium rounded-sm"
                        aria-label={`${recipe.tags.length - 2} more tags`}
                      >
                        …
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 gap-2">
                  <Button
                    className="flex-1 bg-[#0F172A] hover:bg-[#2596be] text-white font-ui font-medium text-[16px] h-10 rounded-[6px] transition-colors"
                    asChild
                  >
                    <Link to={`/recipe/${recipeId}`}>View Recipe</Link>
                  </Button>
                  {isSuperuser && (
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 w-10 shrink-0 p-0 rounded-[6px] border-[#e2e8f0] text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#2596be]"
                      aria-label={`Edit ${recipe.title}`}
                      title="Edit recipe"
                    >
                      <Link to={`/recipe/${recipeId}?edit=1`}>
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
