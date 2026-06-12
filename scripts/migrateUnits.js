// Bulk units migration (Phase 3). Converts every legacy text ingredient into
// the structured { quantity, unit, name, note } format using the SAME parser
// the app uses, and optionally stamps ownership on legacy recipes.
//
// SAFETY:
// - Without --write it only prints what it would change (admin dry run).
// - With --write it FIRST saves a complete JSON backup of all recipes to
//   recipes-backup-<timestamp>.json (git-ignored) before changing anything.
//
// Setup: serviceAccountKey.json in the project root (git-ignored), from
// Firebase Console -> Project settings -> Service accounts. Revoke after use.
//
// Usage:
//   node scripts/migrateUnits.js                                  # dry run
//   node scripts/migrateUnits.js --write                          # migrate
//   node scripts/migrateUnits.js --write --owner-email m@x.com --owner-name Jewel

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import admin from "firebase-admin";
import {
  normalizeIngredient,
  isStructuredIngredient,
} from "../src/lib/units.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = resolve(__dirname, "..", "serviceAccountKey.json");

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
} catch {
  console.error(
    `\nCould not read serviceAccountKey.json at:\n  ${keyPath}\n\n` +
      "Download it from the Firebase Console (Project settings -> " +
      "Service accounts -> Generate new private key) and save it there.\n",
  );
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const args = process.argv.slice(2);
const write = args.includes("--write");
const ownerEmailIdx = args.indexOf("--owner-email");
const ownerNameIdx = args.indexOf("--owner-name");
const ownerEmail = ownerEmailIdx >= 0 ? args[ownerEmailIdx + 1] : null;
const ownerName = ownerNameIdx >= 0 ? args[ownerNameIdx + 1] : null;

const run = async () => {
  let owner = null;
  if (ownerEmail && ownerName) {
    const userRecord = await admin.auth().getUserByEmail(ownerEmail);
    owner = { ownerId: userRecord.uid, ownerName };
    console.log(`Owner stamp for legacy recipes: "${ownerName}"`);
  }

  const snapshot = await db.collection("recipes").get();
  console.log(`Read ${snapshot.size} recipes.`);

  // Full backup before any writes.
  if (write) {
    const backup = snapshot.docs.map((d) => ({ _id: d.id, ...d.data() }));
    const backupFile = `recipes-backup-${Date.now()}.json`;
    writeFileSync(backupFile, JSON.stringify(backup, null, 1), "utf8");
    console.log(`Backup saved: ${backupFile}`);
  }

  const updates = [];
  let linesConverted = 0;

  for (const docSnap of snapshot.docs) {
    const recipe = docSnap.data();
    const update = {};

    const ingredients = recipe.ingredients || [];
    const hasLegacy = ingredients.some((i) => !isStructuredIngredient(i));
    if (hasLegacy) {
      update.ingredients = ingredients.map((i) => {
        if (isStructuredIngredient(i)) return i;
        linesConverted++;
        return normalizeIngredient(i);
      });
    }

    if (owner && !recipe.ownerId) {
      update.ownerId = owner.ownerId;
      update.ownerName = owner.ownerName;
    }

    if (Object.keys(update).length > 0) {
      updates.push({ id: docSnap.id, update });
    }
  }

  console.log(
    `${updates.length} recipes to update, ${linesConverted} ingredient lines to convert.`,
  );

  if (!write) {
    console.log("\nDRY RUN ONLY — re-run with --write to apply.");
    process.exit(0);
  }

  // Batched writes (Firestore limit: 500 ops per batch).
  for (let i = 0; i < updates.length; i += 400) {
    const batch = db.batch();
    for (const { id, update } of updates.slice(i, i + 400)) {
      batch.update(db.collection("recipes").doc(id), update);
    }
    await batch.commit();
    console.log(`Committed ${Math.min(i + 400, updates.length)}/${updates.length}`);
  }

  // Verify: re-read and count remaining legacy lines.
  const verify = await db.collection("recipes").get();
  let remainingLegacy = 0;
  let structured = 0;
  let missingOwner = 0;
  for (const docSnap of verify.docs) {
    const r = docSnap.data();
    for (const ing of r.ingredients || []) {
      if (isStructuredIngredient(ing)) structured++;
      else remainingLegacy++;
    }
    if (!r.ownerId) missingOwner++;
  }
  console.log(
    `\nVERIFY: ${structured} structured lines, ${remainingLegacy} legacy lines remaining, ${missingOwner} recipes without owner.`,
  );
  process.exit(0);
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
