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
      className="sticky top-0 z-10 border-b border-[#e2e8f0] bg-white/95 p-4 shadow-sm backdrop-blur print:hidden"
    >
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/"
          className="font-heading text-2xl font-bold tracking-tight text-[#0F172A] focus-visible:outline-none"
        >
          Jewel's Recipes
        </Link>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="font-ui text-[16px] text-[#0F172A]/80 hover:text-[#0F172A] hover:bg-[#F8FAFC]"
            asChild
          >
            <Link to="/">Browse</Link>
          </Button>

          {/* Only show "My List" and "Add" if the user is logged in */}
          {user && (
            <>
              <Button
                variant="ghost"
                className="font-ui text-[16px] text-[#0F172A]/80 hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                asChild
              >
                <Link to="/my-list">My List</Link>
              </Button>
              <Button
                variant="ghost"
                className="font-ui text-[16px] text-[#0F172A]/80 hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                asChild
              >
                <Link to="/shopping-list">Shopping List</Link>
              </Button>
              <Button
                variant="outline"
                className="font-ui text-[16px] border-[#2596be]/30 text-[#2596be] bg-[#2596be]/5 hover:bg-[#2596be]/10 hover:border-[#2596be]/50"
                asChild
              >
                <Link to="/add">Add Recipe</Link>
              </Button>
            </>
          )}
          {/* Login / Logout Button logic */}
          {user ? (
            <div className="ml-4 flex items-center gap-3 border-l border-[#e2e8f0] pl-4">
              {shouldShowPhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="h-10 w-10 rounded-full border border-[#e2e8f0] object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setFailedPhoto(profilePhoto)}
                />
              ) : (
                <span
                  aria-label="Profile avatar"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e2e8f0] bg-[#F8FAFC] text-[14px] font-semibold text-[#0F172A]"
                >
                  {profileInitials}
                </span>
              )}
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                className="font-ui text-[16px] text-[#0F172A]/80 hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              >
                Log Out
              </Button>
            </div>
          ) : (
            <Button
              onClick={login}
              className="ml-4 font-ui text-[16px] bg-[#0F172A] text-white hover:bg-[#0F172A]/90"
            >
              Log In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
