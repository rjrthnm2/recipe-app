// src/components/Navbar.jsx
import { useMemo, useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useAuth } from "../hooks/useAuth";
import { useRecipes } from "../hooks/useRecipes";

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
  {
    to: "/about",
    label: "Jewel",
    icon: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
  },
];

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const { nickname, updateNickname } = useRecipes();
  const [failedPhoto, setFailedPhoto] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const accountRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (!accountOpen) return;
    const onDocClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  const openAccount = () => {
    setNicknameDraft(nickname || "");
    setAccountOpen((open) => !open);
  };

  const saveNickname = async () => {
    await updateNickname(nicknameDraft);
    setAccountOpen(false);
  };

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
        className="sticky top-0 z-10 border-b border-border bg-white/95 p-4 shadow-sm backdrop-blur print:hidden"
      >
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="font-heading text-2xl font-bold tracking-tight text-primary focus-visible:outline-none"
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
                className="font-ui text-[16px] text-primary/80 hover:text-primary hover:bg-secondary"
                asChild
              >
                <Link to="/">Browse</Link>
              </Button>

              <Button
                variant="ghost"
                className="font-ui text-[16px] text-primary/80 hover:text-primary hover:bg-secondary"
                asChild
              >
                <Link to="/about">Meet Jewel</Link>
              </Button>

              {user && (
                <>
                  <Button
                    variant="ghost"
                    className="font-ui text-[16px] text-primary/80 hover:text-primary hover:bg-secondary"
                    asChild
                  >
                    <Link to="/my-list">My List</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="font-ui text-[16px] text-primary/80 hover:text-primary hover:bg-secondary"
                    asChild
                  >
                    <Link to="/shopping-list">Shopping List</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="font-ui text-[16px] border-accent/30 text-accent bg-accent/5 hover:bg-accent/10 hover:border-accent/50"
                    asChild
                  >
                    <Link to="/add">Add Recipe</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Login / Logout Button logic */}
            {user ? (
              <div className="flex items-center gap-3 sm:ml-4 sm:border-l sm:border-border sm:pl-4">
                <div className="relative" ref={accountRef}>
                  <button
                    type="button"
                    onClick={openAccount}
                    aria-haspopup="dialog"
                    aria-expanded={accountOpen}
                    aria-label="Account and recipe nickname"
                    title="Set your recipe nickname"
                    className="block rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    {shouldShowPhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="h-10 w-10 rounded-full border border-border object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() => setFailedPhoto(profilePhoto)}
                      />
                    ) : (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-[14px] font-semibold text-primary">
                        {profileInitials}
                      </span>
                    )}
                  </button>

                  {accountOpen && (
                    <div
                      role="dialog"
                      aria-label="Recipe nickname"
                      className="absolute right-0 z-30 mt-2 w-72 rounded-[12px] border border-border bg-white p-4 shadow-lg"
                    >
                      <p className="font-ui text-[14px] font-medium text-primary">
                        {user.displayName || user.email}
                      </p>
                      <label
                        htmlFor="recipe-nickname"
                        className="mt-3 block font-ui text-[14px] text-muted-foreground"
                      >
                        Recipe nickname — shown as “by …” on recipes you add
                      </label>
                      <div className="mt-1.5 flex gap-2">
                        <Input
                          id="recipe-nickname"
                          value={nicknameDraft}
                          onChange={(e) => setNicknameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveNickname();
                            }
                          }}
                          maxLength={30}
                          placeholder={nickname || "e.g. Jewel"}
                          className="h-11 border-border font-sans text-[16px]"
                        />
                        <Button
                          type="button"
                          onClick={saveNickname}
                          className="h-11 shrink-0 bg-accent font-ui text-white hover:bg-accent-hover"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={logout}
                  variant="ghost"
                  size="sm"
                  className="font-ui text-[16px] text-primary/80 hover:text-primary hover:bg-secondary"
                >
                  Log Out
                </Button>
              </div>
            ) : (
              <Button
                onClick={login}
                className="ml-4 font-ui text-[16px] bg-primary text-white hover:bg-primary/90"
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
          className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white/95 backdrop-blur sm:hidden print:hidden"
        >
          <div className="grid grid-cols-5">
            {MOBILE_TABS.map((tab) => {
              const isActive = location.pathname === tab.to;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-[60px] flex-col items-center justify-center gap-0.5 py-2 font-ui text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                    isActive ? "text-accent" : "text-primary/70"
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
