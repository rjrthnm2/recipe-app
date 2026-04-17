// src/pages/Home.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRecipes } from "../hooks/useRecipes";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

const INGREDIENT_VARIANTS = {
  tomato: ["tomatoes"],
  tomatoes: ["tomato"],
  potato: ["potatoes"],
  potatoes: ["potato"],
  pepper: ["peppers", "bellpepper", "bell"],
  peppers: ["pepper", "bellpepper", "bell"],
  onion: ["onions"],
  onions: ["onion"],
  chili: ["chilli"],
  chilli: ["chili"],
  garbanzo: ["chickpea", "garbanzoes"],
  chickpea: ["chickpeas", "garbanzo"],
  beef: ["groundbeef"],
  chicken: ["chickenbreast", "chickenthigh"],
};

function normalizeText(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularizeToken(token) {
  if (token.endsWith("ies") && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith("es") && token.length > 4) {
    return token.slice(0, -2);
  }

  if (token.endsWith("s") && token.length > 3) {
    return token.slice(0, -1);
  }

  return token;
}

function tokenize(value = "") {
  const normalized = normalizeText(value);
  if (!normalized) return [];

  return normalized
    .split(" ")
    .flatMap((token) => {
      const singular = singularizeToken(token);
      const variants = INGREDIENT_VARIANTS[token] || [];
      const singularVariants = INGREDIENT_VARIANTS[singular] || [];
      return [token, singular, ...variants, ...singularVariants];
    })
    .filter(Boolean);
}

function formatTagLabel(value = "") {
  const normalized = normalizeText(value.replace(/[()]/g, ""));
  if (!normalized) return "";

  return normalized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function computeRecipeScore(recipe, queryTokens, normalizedQuery) {
  const titleText = normalizeText(recipe.title || "");
  const ingredientText = normalizeText((recipe.ingredients || []).join(" "));
  const tagText = normalizeText(
    (recipe.tags || []).map((tag) => tag.replace(/[()]/g, "")).join(" "),
  );
  const titleTokens = new Set(tokenize(recipe.title || ""));
  const ingredientTokens = new Set(
    tokenize((recipe.ingredients || []).join(" ")),
  );
  const tagTokens = new Set(
    tokenize(
      (recipe.tags || []).map((tag) => tag.replace(/[()]/g, "")).join(" "),
    ),
  );

  let score = 0;
  let matchedTokenCount = 0;

  if (normalizedQuery && tagText.includes(normalizedQuery)) {
    score += 14;
  }

  if (normalizedQuery && titleText.includes(normalizedQuery)) {
    score += 10;
  }

  if (normalizedQuery && ingredientText.includes(normalizedQuery)) {
    score += 6;
  }

  queryTokens.forEach((token) => {
    if (tagTokens.has(token)) {
      score += 10;
      matchedTokenCount += 1;
      return;
    }

    if ([...tagTokens].some((candidate) => candidate.startsWith(token))) {
      score += 7;
      matchedTokenCount += 1;
      return;
    }

    if (titleTokens.has(token)) {
      score += 8;
      matchedTokenCount += 1;
      return;
    }

    if ([...titleTokens].some((candidate) => candidate.startsWith(token))) {
      score += 5;
      matchedTokenCount += 1;
      return;
    }

    if (ingredientTokens.has(token)) {
      score += 5;
      matchedTokenCount += 1;
      return;
    }

    if (
      [...ingredientTokens].some((candidate) => candidate.startsWith(token))
    ) {
      score += 3;
      matchedTokenCount += 1;
    }
  });

  const requiredMatches =
    queryTokens.length <= 1 ? 1 : Math.ceil(queryTokens.length * 0.6);
  const isRelevant =
    queryTokens.length === 0 || matchedTokenCount >= requiredMatches;

  return {
    score,
    isRelevant,
  };
}

export default function Home() {
  const { recipes } = useRecipes();
  const [search, setSearch] = useState("");
  const normalizedQuery = normalizeText(search);
  const queryTokens = tokenize(search);

  const popularTags = useMemo(() => {
    const tagCounts = new Map();
    const tagLabels = new Map();

    recipes.forEach((recipe) => {
      (recipe.tags || []).forEach((tag) => {
        const canonicalTag = normalizeText(tag.replace(/[()]/g, ""));
        if (!canonicalTag) return;

        if (!tagLabels.has(canonicalTag)) {
          tagLabels.set(canonicalTag, formatTagLabel(tag));
        }

        tagCounts.set(canonicalTag, (tagCounts.get(canonicalTag) || 0) + 1);
      });
    });

    return [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([tag]) => tagLabels.get(tag) || formatTagLabel(tag));
  }, [recipes]);

  const filteredRecipes = recipes
    .map((recipe) => {
      const { score, isRelevant } = computeRecipeScore(
        recipe,
        queryTokens,
        normalizedQuery,
      );

      return { recipe, score, isRelevant };
    })
    .filter(({ score, isRelevant }) => {
      if (!normalizedQuery) return true;
      return isRelevant && score > 0;
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.recipe.title.localeCompare(b.recipe.title);
    });

  return (
    <div className="space-y-10">
      <section className="reveal-up relative overflow-hidden rounded-[16px] bg-[#F8FAFC] border border-[#e2e8f0] p-8 shadow-sm md:p-12 text-[#0F172A]">
        <div className="relative flex flex-col gap-6">
          <div className="space-y-3">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-[#0F172A] md:text-5xl">
              Find The Right Recipe Faster
            </h1>
            <p className="font-sans max-w-2xl text-[18px] text-[#0F172A]/80 md:text-[20px]">
              Search by tags first, then titles, then ingredients to surface the
              best matches.
            </p>
          </div>

          <Input
            placeholder="Search by title, ingredient, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search recipes by title, ingredient, or tag"
            className="max-w-2xl bg-white shadow-sm border-[#e2e8f0] h-12 text-[18px] px-4 font-sans"
          />

          {popularTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="mr-2 font-ui text-[16px] font-medium text-[#0F172A]/70">
                Popular tags:
              </span>
              {popularTags.map((tag) => {
                const isActive = normalizeText(search) === normalizeText(tag);
                return (
                  <Button
                    key={tag}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSearch(tag)}
                    className={`rounded-full px-4 py-2 font-ui text-[16px] h-auto transition-transform active:scale-95 hover:scale-105 duration-200 ${isActive ? "bg-[#2596be] text-white hover:bg-[#2596be]/90 border-[#2596be]" : "bg-white border-[#e2e8f0] text-[#0F172A] hover:bg-[#F8FAFC]"}`}
                    aria-pressed={isActive}
                  >
                    {tag}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 py-4">
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#0F172A]">
          All Recipes
        </h2>
        <p className="font-ui rounded-full bg-[#F8FAFC] px-4 py-1.5 text-[16px] text-[#0F172A]/80 border border-[#e2e8f0]">
          {filteredRecipes.length} result
          {filteredRecipes.length === 1 ? "" : "s"}
        </p>
      </div>

      {normalizedQuery && filteredRecipes.length === 0 && (
        <div className="rounded-xl border border-zinc-300 bg-amber-50 p-6 text-left text-zinc-800">
          <p className="text-lg font-semibold">No relevant recipes found.</p>
          <p className="mt-2 text-base">
            Try fewer words or ingredient basics like chicken, tomato, or onion.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredRecipes.map(({ recipe }, index) => {
          // Extract a clean ID from the URL to use for routing
          const recipeId = recipe.url.split("/").pop();

          return (
            <Card
              key={recipe.url || index}
              className="reveal-card flex h-full flex-col bg-[#FAFAFA] border-t-[6px] border-t-[#2596be] border-x-[#e2e8f0] border-b-[#e2e8f0] border-x border-b shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md rounded-[8px] overflow-hidden"
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <CardHeader className="p-4 pb-2">
                <div className="min-h-[5rem] space-y-1.5">
                  <CardTitle className="font-heading line-clamp-2 text-[20px] font-bold leading-tight text-[#0F172A]">
                    {recipe.title}
                  </CardTitle>
                  <div className="flex items-center text-[14px] font-sans text-[#64748b]">
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
                  className="w-full bg-[#0F172A] hover:bg-[#2596be] text-white font-ui font-medium text-[16px] h-10 rounded-[6px] transition-colors"
                  asChild
                >
                  <Link to={`/recipe/${recipeId}`}>View Recipe</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
