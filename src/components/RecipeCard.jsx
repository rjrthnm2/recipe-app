import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { PencilIcon, ClockIcon } from "./Icons";

// The recipe card used on Browse and My List. One source of truth so the
// two grids can never drift apart again.
//
// props:
//   recipe   - recipe object (url IS the document id)
//   index    - grid position, staggers the reveal animation
//   showEdit - render the pencil button linking to the recipe's edit mode
export default function RecipeCard({ recipe, index = 0, showEdit = false }) {
  const recipeId = recipe.url;

  return (
    <Card
      size="sm"
      className="reveal-card flex h-full flex-col gap-2 py-3 bg-surface border-t-[6px] border-t-accent border-x-border border-b-border border-x border-b shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md rounded-[8px] overflow-hidden"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <CardHeader className="pb-0">
        <CardTitle className="font-heading line-clamp-2 text-[18px] md:text-[20px] font-bold leading-tight text-primary">
          {/* Title navigates too — a bigger target than the button alone. */}
          <Link
            to={`/recipe/${recipeId}`}
            className="rounded-sm transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {recipe.title}
          </Link>
        </CardTitle>
      </CardHeader>
      {/* mt-auto anchors prep + divider + tags just above the button,
          so they line up across cards no matter the title length. */}
      <CardContent className="mt-auto pt-0">
        {recipe.prep_time && (
          <div className="flex items-center text-[14px] font-sans text-muted-foreground">
            <ClockIcon width="14" height="14" className="mr-1.5" />
            <span>Prep: {recipe.prep_time}</span>
          </div>
        )}
        <div className="border-t border-dashed border-divider w-full my-1.5"></div>
        <div className="flex flex-nowrap items-center gap-1.5 mt-1.5 overflow-hidden">
          {recipe.tags?.slice(0, 2).map((tag, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="whitespace-nowrap bg-white text-primary/70 border border-border font-ui text-[12px] px-2 py-0.5 font-medium rounded-sm"
            >
              {tag.replace(/[()]/g, "")}
            </Badge>
          ))}
          {(recipe.tags?.length || 0) > 2 && (
            <Badge
              variant="secondary"
              className="shrink-0 bg-secondary text-muted-strong border border-border font-ui text-[12px] px-2 py-0.5 font-medium rounded-sm"
              aria-label={`${recipe.tags.length - 2} more tags`}
            >
              …
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 gap-2">
        <Button
          className="flex-1 bg-primary hover:bg-accent text-white font-ui font-medium text-[16px] h-10 rounded-[6px] transition-colors"
          asChild
        >
          <Link to={`/recipe/${recipeId}`}>View Recipe</Link>
        </Button>
        {showEdit && (
          <Button
            asChild
            variant="outline"
            className="h-10 w-10 shrink-0 p-0 rounded-[6px] border-border text-primary hover:bg-secondary hover:text-accent"
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
}
