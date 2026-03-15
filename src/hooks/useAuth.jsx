// src/hooks/useAuth.jsx
import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "../firebase";

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // This listener automatically fires when someone logs in or out
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe; // Cleanup the listener
  }, []);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  return { user, login, logout };
}
