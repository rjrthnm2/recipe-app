// Backs up every recipe to a JSON file. Read-only: uses the public web
// config (recipes are world-readable by design), no credentials needed.
// Run weekly by .github/workflows/backup.yml, or by hand:
//
//   node scripts/backupRecipes.mjs [outputFile]

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { writeFileSync } from "node:fs";

// Public web config (same as src/firebase.js, which we can't import in Node).
const firebaseConfig = {
  apiKey: "AIzaSyCjz-CXYxjsGqnpk9km8KSgU_viD6nbleU",
  authDomain: "recipe-app-f8fd3.firebaseapp.com",
  projectId: "recipe-app-f8fd3",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const snapshot = await getDocs(collection(db, "recipes"));
const recipes = snapshot.docs.map((d) => ({ _id: d.id, ...d.data() }));

if (recipes.length === 0) {
  console.error("Backup ABORTED: read 0 recipes (connection or rules issue).");
  process.exit(1);
}
if (recipes.length < 100) {
  console.warn(
    `WARNING: only ${recipes.length} recipes (expected 130+). ` +
      "Backing up anyway, but check whether recipes were deleted.",
  );
}

const outFile =
  process.argv[2] ||
  `recipes-backup-${new Date().toISOString().slice(0, 10)}.json`;
writeFileSync(outFile, JSON.stringify(recipes, null, 1), "utf8");
console.log(`Backed up ${recipes.length} recipes to ${outFile}`);
process.exit(0);
