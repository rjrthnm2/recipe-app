// src/components/Navbar.jsx
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "../hooks/useAuth";

function NavIcon({ path, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {path}
    </svg>
  );
}

const MOBILE_TABS = [
  {
    to: "/",
    label: "Browse",
    icon: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
  },
  {
    to: "/my-list",
    label: "My List",
    icon: (
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    ),
  },
  {
    to: "/shopping-list",
    label: "Shopping",
    icon: (
      <>
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </>
    ),
  },
  {
    to: "/add",
    label: "Add",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </>
    ),
  },
];

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const [failedPhoto, setFailedPhoto] = useState("");
  const location = useLocation();

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
    <>
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
            {/* Page links live in the bottom tab bar on mobile when logged in. */}
            <div
              className={`${user ? "hidden sm:flex" : "flex"} items-center gap-3`}
            >
              <Button
                variant="ghost"
                className="font-ui text-[16px] text-[#0F172A]/80 hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                asChild
              >
                <Link to="/">Browse</Link>
              </Button>

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
            </div>

            {/* Login / Logout Button logic */}
            {user ? (
              <div className="flex items-center gap-3 sm:ml-4 sm:border-l sm:border-[#e2e8f0] sm:pl-4">
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

      {/* Mobile bottom tab bar — big, always-visible targets (no hamburger). */}
      {user && (
        <nav
          aria-label="Quick navigation"
          className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e2e8f0] bg-white/95 backdrop-blur sm:hidden print:hidden"
        >
          <div className="grid grid-cols-4">
            {MOBILE_TABS.map((tab) => {
              const isActive = location.pathname === tab.to;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 py-2 font-ui text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2596be] ${
                    isActive ? "text-[#2596be]" : "text-[#0F172A]/70"
                  }`}
                >
                  <NavIcon path={tab.icon} width="22" height="22" />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
