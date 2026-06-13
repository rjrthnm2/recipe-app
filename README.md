# Jewel's Recipes

A digital recipe box for Maureen and her friends — browse, save, plan meals, and
build shopping lists. Designed for legibility and ease of use (large text, big
tap targets, high contrast). Live and hosted on Firebase.

## Tech stack

- **React 19** + **Vite** — UI and build tooling
- **Tailwind CSS v4** + **shadcn/ui** — styling and components (`src/components/ui`)
- **Firebase** — Firestore (database), Google sign-in (auth), Hosting
- **React Router 7** — page routing

## Project structure

```
src/
  firebase.js          Firebase connection + config
  hooks/
    useAuth.jsx        Auth context: current user, isAdmin, login, logout
    useRecipes.jsx     Recipes context: fetch / add / edit / delete / save
  pages/
    Home.jsx           Browse + ranked search
    RecipeDetail.jsx   View a recipe (+ edit/delete for superusers)
    AddRecipe.jsx      Add-a-recipe form
    MyList.jsx         Personal saved recipes
    ShoppingList.jsx   Meal planner + shopping-list builder
  components/
    Navbar.jsx
    ui/                shadcn/ui primitives
  data/
    jewel_recipes.json Seed data (used once if the database is empty)
scripts/
  setAdmins.js         One-time script to grant/revoke the admin claim
firestore.rules        Server-side security rules (source of truth)
```

## Permissions model

| Who | Browse | Add | Edit / Delete |
| --- | :---: | :---: | :---: |
| Not logged in | ✅ | ❌ | ❌ |
| Any logged-in user | ✅ | ✅ | ❌ |
| Superusers (admin claim) | ✅ | ✅ | ✅ |

Superusers are identified by a Firebase **custom claim** (`admin: true`) on
their auth token — no emails are stored in the codebase. Both `firestore.rules`
(server-side enforcement) and the app UI check this claim. Saved-recipe lists
are private per user.

### Granting admin access

```bash
# 1. Download a service account key from the Firebase Console
#    (Project settings -> Service accounts -> Generate new private key)
#    and save it as serviceAccountKey.json in the project root (git-ignored).
# 2. Run:
node scripts/setAdmins.js person@example.com
# Revoke with:  node scripts/setAdmins.js --remove person@example.com
```

The affected user must sign out and back in for the change to take effect.

## Local development

```bash
npm install
npm run dev      # start the dev server
npm run lint     # run ESLint
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Deploying

Requires the Firebase CLI (`npm i -g firebase-tools`) and access to the
`recipe-app-f8fd3` project.

```bash
npm run build
firebase deploy --only hosting          # deploy the site
firebase deploy --only firestore:rules  # deploy security rules
```

## Operations notes

- **Backups.** Set up a periodic Firestore export from the
  [Firebase Console](https://console.firebase.google.com/project/recipe-app-f8fd3)
  (Firestore -> Import/Export, or `gcloud firestore export`). The
  `deleted_recipes` collection is a soft-delete archive, not a backup. A local
  rollback snapshot from the June 2026 units migration
  (`recipes-backup-*.json`, git-ignored) exists on the maintainer's machine.
- **Dev writes to production.** `npm run dev` talks to the live Firestore
  project. Be careful with destructive testing; if testing gets heavier,
  create a second Firebase project and point a `.env.local` config at it.
- **Security rules.** `firestore.rules` validates recipe writes (allowlisted
  fields, owner stamp must match the signed-in account). Redeploy with
  `firebase deploy --only firestore:rules` after any change.
- **Dependency audits.** `npm audit --omit=dev` checks what actually ships.
  Remaining esbuild/vite advisories are dev-server-only and need a major vite
  upgrade to clear.
