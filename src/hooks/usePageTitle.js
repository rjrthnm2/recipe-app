import { useEffect } from "react";

const BASE_TITLE = "Jewel's Recipes";

// Keeps the browser tab label in sync with the page you're on.
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
}
