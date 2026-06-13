// src/hooks/useAuth.jsx
import { useState, useEffect, createContext, useContext } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "../firebase";
import { useToast } from "../components/Toast";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const showToast = useToast();

  useEffect(() => {
    // A single listener for the whole app. Fires when someone logs in or out.
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // Read the "admin" custom claim from the user's token. This is set
      // server-side (scripts/setAdmins.js) — no emails live in the app.
      if (currentUser) {
        try {
          const tokenResult = await currentUser.getIdTokenResult();
          setIsAdmin(tokenResult.claims.admin === true);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }

      setAuthLoading(false);
    });
    return unsubscribe; // Cleanup the listener
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      // Closing the popup yourself isn't an error worth announcing.
      if (error.code === "auth/popup-closed-by-user") return;
      if (error.code === "auth/popup-blocked") {
        showToast(
          "Your browser blocked the sign-in window. Please allow pop-ups for this site and try again.",
          "error",
        );
      } else {
        showToast("Sign-in didn't work. Please try again.", "error");
      }
      console.error("Login failed:", error);
    }
  };
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
