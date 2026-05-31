// The accounts allowed to edit and delete recipes (superusers).
// IMPORTANT: this list is only for showing/hiding UI. The real enforcement
// lives in firestore.rules on the server — keep both lists in sync.
export const ADMIN_EMAILS = [
  "robinzjephthah@gmail.com",
  "maureenpeck1412@gmail.com",
];

export function isAdminEmail(email) {
  return Boolean(email) && ADMIN_EMAILS.includes(email);
}
