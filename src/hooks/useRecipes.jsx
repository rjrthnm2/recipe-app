// src/hooks/useRecipes.jsx
import { useState, useEffect, createContext, useContext } from "react";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./useAuth"; // <-- Import our new auth hook
import defaultRecipes from "../data/jewel_recipes.json";

export const RecipesContext = createContext();

export function RecipesProvider({ children }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState([]);

  const { user } = useAuth(); // <-- Get the currently logged-in user

  // 1. Fetch the master recipe list (Same as before)
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const recipesCol = collection(db, "recipes");
        const recipeSnapshot = await getDocs(recipesCol);

        if (recipeSnapshot.empty) {
          const batchOfPromises = defaultRecipes.map((recipe) => {
            const docId = recipe.url.split("/").pop();
            const docRef = doc(db, "recipes", docId);
            return setDoc(docRef, { ...recipe, url: docId });
          });
          await Promise.all(batchOfPromises);

          const newSnapshot = await getDocs(recipesCol);
          setRecipes(newSnapshot.docs.map((doc) => doc.data()));
        } else {
          setRecipes(recipeSnapshot.docs.map((doc) => doc.data()));
        }
      } catch (error) {
        console.error("Error fetching recipes: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  // 2. Fetch the user's personal "My List" from the cloud whenever they log in
  useEffect(() => {
    const fetchUserList = async () => {
      if (!user) {
        setSavedIds([]); // If logged out, empty the list
        return;
      }
      // Look for a document matching this user's unique ID
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setSavedIds(userDoc.data().savedRecipes || []);
      }
    };
    fetchUserList();
  }, [user]);

  // 3. Update toggleSave to sync with Firestore instead of local storage
  const toggleSave = async (recipeUrl) => {
    if (!user) {
      alert("Please log in to save recipes to your list!");
      return;
    }

    const newSavedIds = savedIds.includes(recipeUrl)
      ? savedIds.filter((id) => id !== recipeUrl)
      : [...savedIds, recipeUrl];

    setSavedIds(newSavedIds); // Update the screen instantly

    // Save the new array to the user's personal cloud document
    // { merge: true } ensures we don't accidentally overwrite other user data if we add features later
    await setDoc(
      doc(db, "users", user.uid),
      { savedRecipes: newSavedIds },
      { merge: true },
    );
  };

  const addRecipe = async (newRecipeData) => {
    if (!user) {
      alert("Please log in to add new recipes!");
      return;
    }

    const uniqueId =
      newRecipeData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
      "-" +
      Date.now();
    const completeRecipe = { ...newRecipeData, url: uniqueId };

    try {
      const docRef = doc(db, "recipes", uniqueId);
      await setDoc(docRef, completeRecipe);
      setRecipes((prev) => [completeRecipe, ...prev]);
      return uniqueId;
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const updateRecipe = async (id, updatedData) => {
    if (
      !user ||
      !["robinzjephthah@gmail.com", "maureenpeck1412@gmail.com"].includes(
        user.email,
      )
    ) {
      alert("Only a superuser can edit recipes.");
      return;
    }

    try {
      const docRef = doc(db, "recipes", id);
      await updateDoc(docRef, updatedData);

      // Update local state
      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.url === id ? { ...recipe, ...updatedData } : recipe,
        ),
      );
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("Failed to update recipe.");
    }
  };

  const deleteRecipe = async (id) => {
    if (
      !user ||
      !["robinzjephthah@gmail.com", "maureenpeck1412@gmail.com"].includes(
        user.email,
      )
    ) {
      alert("Only a superuser can delete recipes.");
      return;
    }

    try {
      // Find the recipe data before deleting it
      const recipeToArchive = recipes.find((r) => r.url === id);

      if (recipeToArchive) {
        // Save the deleted recipe to a "deleted_recipes" collection (our cloud JSON database for deleted items)
        const deletedDocRef = doc(db, "deleted_recipes", id);
        await setDoc(deletedDocRef, {
          ...recipeToArchive,
          deletedAt: new Date().toISOString(),
          deletedBy: user.email,
        });
      }

      const docRef = doc(db, "recipes", id);
      await deleteDoc(docRef);

      // Update local state
      setRecipes((prev) => prev.filter((recipe) => recipe.url !== id));

      // We could also remove from savedIds if it's there
      if (savedIds.includes(id)) {
        await toggleSave(id);
      }
    } catch (error) {
      console.error("Error deleting document: ", error);
      alert("Failed to delete recipe.");
    }
  };

  return (
    <RecipesContext.Provider
      value={{
        recipes,
        savedIds,
        toggleSave,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        loading,
      }}
    >
      {children}
    </RecipesContext.Provider>
  );
}

export function useRecipes() {
  return useContext(RecipesContext);
}
