// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import MyList from "./pages/MyList";
import RecipeDetail from "./pages/RecipeDetail";
import AddRecipe from "./pages/AddRecipe";

function App() {
  return (
    <Router>
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
          className="container mx-auto p-5 md:p-8 lg:p-10"
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/my-list" element={<MyList />} />
            <Route path="/add" element={<AddRecipe />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
