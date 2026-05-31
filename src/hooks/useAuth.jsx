// src/hooks/useAuth.jsx
import { useState, useEffect, createContext, useContext } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // A single listener for the whole app. Fires when someone logs in or out.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe; // Cleanup the listener
  }, []);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, login, logout, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
