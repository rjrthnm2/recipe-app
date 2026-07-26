// src/App.jsx
import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import MyList from "./pages/MyList";
import RecipeDetail from "./pages/RecipeDetail";
import AddRecipe from "./pages/AddRecipe";
import ShoppingList from "./pages/ShoppingList";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import { RecipesProvider } from "./hooks/useRecipes";
import { AuthProvider } from "./hooks/useAuth";
import { ToastProvider } from "./components/Toast";

// Lazy-loaded so the 3D globe (three.js) only downloads on /about.
const About = lazy(() => import("./pages/About"));

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ToastProvider>
        <AuthProvider>
          <RecipesProvider>
          <div className="min-h-screen bg-background text-foreground font-sans">
            <a
              href="#main-content"
              className="sr-only absolute left-3 top-3 z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only"
            >
              Skip to main content
            </a>
            <Navbar />
            <main
              id="main-content"
              className="container mx-auto p-5 pb-24 sm:pb-8 md:p-8 lg:p-10"
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/my-list" element={<MyList />} />
                <Route path="/shopping-list" element={<ShoppingList />} />
                <Route path="/add" element={<AddRecipe />} />
                <Route path="/recipe/:id" element={<RecipeDetail />} />
                <Route
                  path="/about"
                  element={
                    <Suspense
                      fallback={
                        <div className="p-8 text-center font-sans text-[18px] text-muted-strong">
                          <p>Loading Jewel's page...</p>
                          <p className="mt-1 text-[16px]">
                            The globe takes a few seconds the first time.
                          </p>
                        </div>
                      }
                    >
                      <About />
                    </Suspense>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
          </RecipesProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
