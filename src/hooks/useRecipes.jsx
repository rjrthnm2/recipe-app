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
import { useToast } from "../components/Toast";
import defaultRecipes from "../data/jewel_recipes.json";

const RecipesContext = createContext();

export function RecipesProvider({ children }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [nickname, setNickname] = useState("");

  const { user, isAdmin } = useAuth(); // <-- Get the currently logged-in user
  const showToast = useToast();

  // Default recipe byline when no nickname is set: first name from Google.
  const defaultNickname =
    user?.displayName?.trim().split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    "";
  const displayNickname = nickname || defaultNickname;

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
        setLoadError(true);
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
        setNickname("");
        return;
      }
      // Look for a document matching this user's unique ID
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setSavedIds(userDoc.data().savedRecipes || []);
        setNickname(userDoc.data().nickname || "");
      }
    };
    fetchUserList();
  }, [user]);

  // Save the user's chosen recipe nickname (shown as "by <nickname>").
  const updateNickname = async (newNickname) => {
    if (!user) return;
    const cleaned = newNickname.trim().slice(0, 30);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { nickname: cleaned },
        { merge: true },
      );
      setNickname(cleaned);
      showToast("Nickname saved.", "success");
    } catch (error) {
      console.error("Error saving nickname: ", error);
      showToast("Could not save the nickname. Please try again.", "error");
    }
  };

  // 3. Update toggleSave to sync with Firestore instead of local storage
  const toggleSave = async (recipeUrl) => {
    if (!user) {
      showToast("Please log in to save recipes to your list.", "info");
      return;
    }

    const previousSavedIds = savedIds;
    const newSavedIds = savedIds.includes(recipeUrl)
      ? savedIds.filter((id) => id !== recipeUrl)
      : [...savedIds, recipeUrl];

    setSavedIds(newSavedIds); // Update the screen instantly

    try {
      // Save the new array to the user's personal cloud document.
      // { merge: true } keeps other fields (nickname) intact.
      await setDoc(
        doc(db, "users", user.uid),
        { savedRecipes: newSavedIds },
        { merge: true },
      );
    } catch (error) {
      // Put the screen back the way it was so it never lies about a save.
      setSavedIds(previousSavedIds);
      console.error("Error saving list: ", error);
      showToast(
        "That didn't save. Check your internet and try again.",
        "error",
      );
    }
  };

  const addRecipe = async (newRecipeData) => {
    if (!user) {
      showToast("Please log in to add new recipes.", "info");
      return;
    }

    // Slug + timestamp + short random suffix so two same-titled recipes can
    // never collide, even if added in the same instant.
    const uniqueId =
      newRecipeData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
      "-" +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 6);
    const completeRecipe = {
      ...newRecipeData,
      url: uniqueId,
      // Stamp the creator so everyone can see whose recipe it is. Recipes
      // without these fields predate ownership and are Jewel's.
      ownerId: user.uid,
      ownerName: displayNickname || "Friend",
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = doc(db, "recipes", uniqueId);
      await setDoc(docRef, completeRecipe);
      setRecipes((prev) => [completeRecipe, ...prev]);
      return uniqueId;
    } catch (error) {
      console.error("Error adding document: ", error);
      showToast(
        "The recipe didn't save. Check your internet and try again.",
        "error",
      );
      return null;
    }
  };

  // Superusers manage everything; creators manage the recipes they added.
  // (Firestore rules enforce the same thing server-side.)
  const canManageRecipe = (recipe) =>
    Boolean(user) && (isAdmin || (recipe && recipe.ownerId === user.uid));

  const updateRecipe = async (id, updatedData) => {
    const target = recipes.find((r) => r.url === id);
    if (!canManageRecipe(target)) {
      showToast("You can only edit recipes you added.", "error");
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
      showToast("Changes saved.", "success");
    } catch (error) {
      console.error("Error updating document: ", error);
      showToast("Failed to update the recipe. Please try again.", "error");
    }
  };

  const deleteRecipe = async (id) => {
    // Find the recipe data before deleting it
    const recipeToArchive = recipes.find((r) => r.url === id);
    if (!canManageRecipe(recipeToArchive)) {
      showToast("You can only delete recipes you added.", "error");
      return;
    }

    try {

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

      // Drop it from the user's saved list too (best-effort — the delete
      // itself already succeeded, so don't fail the whole operation).
      if (savedIds.includes(id)) {
        const newSavedIds = savedIds.filter((saved) => saved !== id);
        setSavedIds(newSavedIds);
        try {
          await setDoc(
            doc(db, "users", user.uid),
            { savedRecipes: newSavedIds },
            { merge: true },
          );
        } catch (cleanupError) {
          console.error("Error updating saved list: ", cleanupError);
        }
      }
      showToast("Recipe deleted.", "success");
    } catch (error) {
      console.error("Error deleting document: ", error);
      showToast("Failed to delete the recipe. Please try again.", "error");
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
        canManageRecipe,
        loading,
        loadError,
        nickname: displayNickname,
        updateNickname,
      }}
    >
      {children}
    </RecipesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRecipes() {
  return useContext(RecipesContext);
}
