// Set a user's recipe nickname (shown as "by <nickname>") from the server.
// Useful when setting it on someone's behalf — users can only write their
// own profile from the app.
//
// Setup: download a service account key from the Firebase Console
// (Project settings -> Service accounts -> Generate new private key) and
// save it as serviceAccountKey.json in the project root (git-ignored).
// Revoke the key when done.
//
// Usage:
//   node scripts/setNickname.js someone@example.com Jewel

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

const [email, ...nicknameParts] = process.argv.slice(2);
const nickname = nicknameParts.join(" ").trim().slice(0, 30);

if (!email || !nickname) {
  console.error("Usage: node scripts/setNickname.js <email> <nickname>");
  process.exit(1);
}

const run = async () => {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin
      .firestore()
      .doc(`users/${userRecord.uid}`)
      .set({ nickname }, { merge: true });
    console.log(`Set nickname "${nickname}" for ${email}`);
  } catch (err) {
    console.error(`Failed: ${err.message}`);
    process.exit(1);
  }
  process.exit(0);
};

run();
