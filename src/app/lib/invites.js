import { db } from "@/lib/firestore";
import { fetchsheetdataNoCache } from "@/lib/sheets";
import { getRowValue } from "@/lib/ctaContent";

export function normalizeInviteSlug(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isActiveInvite(row = {}) {
  const activeValue = String(getRowValue(row, ["active", "isactive"]) || "1")
    .trim()
    .toLowerCase();
  return !["0", "false", "no", "inactive"].includes(activeValue);
}

function serializeFirestoreInvite(snapshot) {
  if (!snapshot.exists) return null;

  const data = snapshot.data() || {};
  return {
    id: snapshot.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || "",
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || "",
  };
}

export async function getInviteBySlug(slug) {
  const normalizedSlug = normalizeInviteSlug(slug);
  if (!normalizedSlug) return null;

  if (db) {
    const snapshot = await db.collection("invites").doc(normalizedSlug).get();
    const firestoreInvite = serializeFirestoreInvite(snapshot);
    if (firestoreInvite && isActiveInvite(firestoreInvite)) {
      return firestoreInvite;
    }
  }

  const sheetInvites = await fetchsheetdataNoCache("invites");
  return sheetInvites.find((row) => {
    const rowSlug = normalizeInviteSlug(getRowValue(row, ["slug", "inviteSlug", "path"]));
    return rowSlug === normalizedSlug && isActiveInvite(row);
  }) || null;
}

