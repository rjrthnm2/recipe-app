// src/pages/Home.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRecipes } from "../hooks/useRecipes";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import LoadErrorNotice from "../components/LoadErrorNotice";
import RecipeCard from "../components/RecipeCard";
import usePageTitle from "../hooks/usePageTitle";

// Mobile-only floating button — 132 cards is a long way back up.
function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
        })
      }
      className="fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:hidden print:hidden"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    </button>
  );
}

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
  usePageTitle("Browse Recipes");
  const { recipes, loading, loadError } = useRecipes();
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
      <section className="reveal-up relative overflow-hidden rounded-[16px] bg-secondary border border-border p-5 shadow-sm md:p-12 text-primary">
        <div className="relative flex flex-col gap-4 md:gap-6">
          <div className="space-y-2 md:space-y-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-primary md:text-5xl">
              Find The Right Recipe Faster
            </h1>
            <p className="font-sans max-w-2xl text-[16px] text-primary/80 md:text-[20px]">
              Search by name, ingredient, or tag — or browse the whole
              collection below.{" "}
              <Link
                to="/about"
                className="whitespace-nowrap font-medium text-accent underline-offset-4 hover:underline"
              >
                Made with love by Jewel. Come meet her →
              </Link>
            </p>
          </div>

          <Input
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search recipes by title, ingredient, or tag"
            className="max-w-2xl bg-white shadow-sm border-border h-12 text-[18px] px-4 font-sans"
          />

          {popularTags.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 sm:flex-wrap sm:gap-3 sm:overflow-visible sm:pt-2">
              <span className="shrink-0 mr-1 font-ui text-[14px] sm:text-[16px] font-medium text-primary/70 sm:mr-2">
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
                    className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 sm:px-4 sm:py-2 font-ui text-[14px] sm:text-[16px] h-auto transition-transform active:scale-95 hover:scale-105 duration-200 ${isActive ? "bg-accent text-white hover:bg-accent/90 border-accent" : "bg-white border-border text-primary hover:bg-secondary"}`}
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
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary">
          All Recipes
        </h2>
        <p className="font-ui tabular rounded-full bg-secondary px-4 py-1.5 text-[16px] text-primary/80 border border-border">
          {loading
            ? "Loading…"
            : `${filteredRecipes.length} result${
                filteredRecipes.length === 1 ? "" : "s"
              }`}
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-[8px] border border-border border-t-[6px] border-t-divider bg-secondary"
            />
          ))}
        </div>
      )}

      {!loading && loadError && <LoadErrorNotice />}

      {!loading && normalizedQuery && filteredRecipes.length === 0 && (
        <div className="rounded-xl border border-border bg-secondary p-6 text-left text-primary">
          <p className="font-sans text-lg font-semibold">
            No relevant recipes found.
          </p>
          <p className="mt-2 font-sans text-base text-muted-strong">
            Try fewer words or ingredient basics like chicken, tomato, or onion.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSearch("")}
            className="mt-4 h-11 border-border px-5 font-ui text-[16px] font-medium text-primary hover:bg-white"
          >
            Clear search
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredRecipes.map(({ recipe }, index) => (
          <RecipeCard key={recipe.url || index} recipe={recipe} index={index} />
        ))}
      </div>

      <BackToTopButton />
    </div>
  );
}
