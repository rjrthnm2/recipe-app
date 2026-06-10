// One-time / occasional admin management script.
//
// Grants the "admin" custom claim to the given accounts. The claim is what
// firestore.rules and the app check — no emails are stored in the codebase.
//
// Setup (only needed once):
//   1. In the Firebase Console: Project settings -> Service accounts ->
//      "Generate new private key". Save the downloaded file as
//      serviceAccountKey.json in the project root (it is git-ignored).
//   2. npm install   (firebase-admin is a devDependency)
//
// Usage:
//   node scripts/setAdmins.js someone@example.com another@example.com
//
// To revoke admin, pass --remove:
//   node scripts/setAdmins.js --remove someone@example.com
//
// After running, the affected users must sign out and back in for the new
// permission to take effect on their device.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import admin from "firebase-admin";

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

const args = process.argv.slice(2);
const remove = args.includes("--remove");
const emails = args.filter((a) => a !== "--remove");

if (emails.length === 0) {
  console.error("Pass one or more account emails as arguments.");
  process.exit(1);
}

const run = async () => {
  for (const email of emails) {
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      await admin
        .auth()
        .setCustomUserClaims(userRecord.uid, remove ? { admin: null } : { admin: true });
      console.log(
        `${remove ? "Removed admin from" : "Granted admin to"} ${email}`,
      );
    } catch (err) {
      console.error(`Failed for ${email}: ${err.message}`);
    }
  }
  process.exit(0);
};

run();
