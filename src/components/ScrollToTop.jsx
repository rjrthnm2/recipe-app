import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Start each page at the top — without this, navigating from a scrolled
// list leaves the next page scrolled partway down.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
