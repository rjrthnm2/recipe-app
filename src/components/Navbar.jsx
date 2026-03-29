// src/components/Navbar.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const [failedPhoto, setFailedPhoto] = useState("");

  const profilePhoto =
    user?.photoURL ||
    user?.providerData?.find((account) => account?.photoURL)?.photoURL ||
    "";

  const shouldShowPhoto = Boolean(profilePhoto) && failedPhoto !== profilePhoto;

  const profileInitials = useMemo(() => {
    const label = user?.displayName || user?.email || "User";
    const words = label.trim().split(/\s+/).slice(0, 2);
    return words
      .map((word) => word[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2);
  }, [user?.displayName, user?.email]);

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-10 border-b border-zinc-200 bg-card/95 p-4 shadow-sm backdrop-blur print:hidden"
    >
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/"
          className="text-2xl font-bold tracking-tight text-foreground focus-visible:outline-none"
        >
          Jewel's Recipes
        </Link>

        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/">Browse</Link>
          </Button>

          {/* Only show "My List" and "Add" if the user is logged in */}
          {user && (
            <>
              <Button variant="ghost" asChild>
                <Link to="/my-list">My List</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/shopping-list">Shopping List</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/add">Add Recipe</Link>
              </Button>
            </>
          )}
          {/* Login / Logout Button logic */}
          {user ? (
            <div className="ml-4 flex items-center gap-3 border-l border-zinc-300 pl-4">
              {shouldShowPhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="h-9 w-9 rounded-full border border-zinc-300 object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setFailedPhoto(profilePhoto)}
                />
              ) : (
                <span
                  aria-label="Profile avatar"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-xs font-semibold text-zinc-700"
                >
                  {profileInitials}
                </span>
              )}
              <Button onClick={logout} variant="ghost" size="sm">
                Log Out
              </Button>
            </div>
          ) : (
            <Button onClick={login} className="ml-4">
              Log In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
