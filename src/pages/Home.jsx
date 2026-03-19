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
      <section className="reveal-up relative overflow-hidden rounded-2xl border border-zinc-300/70 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-200/35 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 left-6 h-36 w-36 rounded-full bg-orange-200/30 blur-2xl" />

        <div className="relative flex flex-col gap-5">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
              Find The Right Recipe Faster
            </h1>
            <p className="max-w-2xl text-base text-zinc-700 md:text-lg">
              Search by tags first, then titles, then ingredients to surface the
              best matches.
            </p>
          </div>

          <Input
            placeholder="Search by title, ingredient, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search recipes by title, ingredient, or tag"
            className="max-w-2xl bg-white/85 shadow-sm"
          />

          {popularTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="mr-1 text-sm font-medium text-zinc-700">
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
                    className="rounded-full"
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          All Recipes
        </h2>
        <p className="rounded-full bg-white/70 px-3 py-1 text-sm text-zinc-700 ring-1 ring-zinc-200">
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRecipes.map(({ recipe }, index) => {
          // Extract a clean ID from the URL to use for routing
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
    </div>
  );
}
