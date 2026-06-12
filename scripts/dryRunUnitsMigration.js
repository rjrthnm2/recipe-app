// DRY RUN for the bulk units migration. Reads all live recipes (public read
// access — no credentials) and runs every legacy ingredient line through the
// SAME parser the app uses (normalizeIngredient). Writes a full before/after
// report to migration-dryrun-report.md. Makes NO writes to the database.
//
// Usage: node scripts/dryRunUnitsMigration.js

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { writeFileSync } from "node:fs";
import {
  normalizeIngredient,
  formatIngredient,
  isStructuredIngredient,
} from "../src/lib/units.js";

// Public web config (same as src/firebase.js, which we can't import in Node
// because it initializes browser-only Analytics).
const firebaseConfig = {
  apiKey: "AIzaSyCjz-CXYxjsGqnpk9km8KSgU_viD6nbleU",
  authDomain: "recipe-app-f8fd3.firebaseapp.com",
  projectId: "recipe-app-f8fd3",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const stats = {
  recipes: 0,
  recipesAlreadyStructured: 0,
  lines: 0,
  alreadyStructured: 0,
  withQtyAndUnit: 0,
  withQtyNoUnit: 0,
  noQty: 0,
};
const unitCounts = new Map(); // canonical unit -> count
const unknownFirstTokens = new Map(); // first word after qty when no unit matched
const flagged = []; // { recipe, original, parsed, reasons }
const rows = []; // full before/after listing

function canonToken(word) {
  return word.toLowerCase().replace(/[^a-z0-9/]/g, "");
}

const snapshot = await getDocs(collection(db, "recipes"));

for (const docSnap of snapshot.docs) {
  const recipe = docSnap.data();
  stats.recipes++;
  const title = recipe.title || docSnap.id;
  let recipeHasLegacy = false;

  for (const raw of recipe.ingredients || []) {
    stats.lines++;

    if (isStructuredIngredient(raw)) {
      stats.alreadyStructured++;
      continue;
    }
    recipeHasLegacy = true;

    const parsed = normalizeIngredient(raw);
    const after = formatIngredient(parsed);
    rows.push({ title, before: String(raw), parsed, after });

    const reasons = [];
    if (!parsed.name) reasons.push("empty name");
    if (/^[^a-zA-Z]/.test(parsed.name)) reasons.push("name starts non-letter");
    if (/\d/.test(parsed.name)) reasons.push("digit in name");
    if (/\//.test(parsed.name)) reasons.push("slash in name");
    if (!parsed.quantity && /^\s*[\d⁄½¼¾⅓⅔]/.test(String(raw)))
      reasons.push("line starts numeric but no quantity parsed");

    if (reasons.length > 0) {
      flagged.push({ recipe: title, original: String(raw), parsed, reasons });
    }

    if (parsed.unit) {
      stats.withQtyAndUnit++;
      unitCounts.set(parsed.unit, (unitCounts.get(parsed.unit) || 0) + 1);
    } else if (parsed.quantity) {
      stats.withQtyNoUnit++;
      const first = canonToken(parsed.name.split(/\s+/)[0] || "");
      if (first)
        unknownFirstTokens.set(first, (unknownFirstTokens.get(first) || 0) + 1);
    } else {
      stats.noQty++;
    }
  }

  if (!recipeHasLegacy && (recipe.ingredients || []).length > 0) {
    stats.recipesAlreadyStructured++;
  }
}

const sortDesc = (map) => [...map.entries()].sort((a, b) => b[1] - a[1]);

let md = `# Units migration — DRY RUN report\n\n`;
md += `## Summary\n\n`;
md += `- Recipes: **${stats.recipes}** (${stats.recipesAlreadyStructured} already fully structured)\n`;
md += `- Ingredient lines: **${stats.lines}**\n`;
md += `  - Already structured (skipped): ${stats.alreadyStructured}\n`;
md += `  - Parsed with quantity + unit: ${stats.withQtyAndUnit}\n`;
md += `  - Quantity but no unit (count items like "1 chicken"): ${stats.withQtyNoUnit}\n`;
md += `  - No leading quantity (e.g. "Salt to taste"): ${stats.noQty}\n`;
md += `- **Flagged for review: ${flagged.length}**\n\n`;

md += `## Units that will be assigned\n\n| Unit | Count |\n|---|---|\n`;
for (const [unit, count] of sortDesc(unitCounts))
  md += `| ${unit} | ${count} |\n`;

md += `\n## First word after a quantity when NO unit matched\n\n`;
md += `(Mostly food words — that's correct. Review for unit-like words worth promoting/aliasing.)\n\n| Word | Count |\n|---|---|\n`;
for (const [tok, count] of sortDesc(unknownFirstTokens))
  md += `| ${tok} | ${count} |\n`;

md += `\n## Flagged lines (${flagged.length})\n\n`;
for (const f of flagged) {
  md += `- **${f.recipe}**: \`${f.original}\`\n`;
  md += `  - parsed: qty=\`${f.parsed.quantity}\` unit=\`${f.parsed.unit}\` name=\`${f.parsed.name}\` note=\`${f.parsed.note}\`\n`;
  md += `  - reasons: ${f.reasons.join(", ")}\n`;
}

md += `\n## Full before → after listing (${rows.length} legacy lines)\n\n`;
let lastTitle = "";
for (const row of rows) {
  if (row.title !== lastTitle) {
    md += `\n### ${row.title}\n\n`;
    lastTitle = row.title;
  }
  const changed = row.before.trim() === row.after.trim() ? "" : " ⟶ CHANGED";
  md += `- \`${row.before}\` → \`${row.after}\`${changed}\n`;
  md += `  - qty=\`${row.parsed.quantity}\` unit=\`${row.parsed.unit}\` name=\`${row.parsed.name}\` note=\`${row.parsed.note}\`\n`;
}

writeFileSync("migration-dryrun-report.md", md, "utf8");

console.log("=== DRY RUN COMPLETE (no writes) ===");
console.log(JSON.stringify(stats, null, 2));
console.log(`Flagged: ${flagged.length}`);
console.log("Report: migration-dryrun-report.md");
process.exit(0);
