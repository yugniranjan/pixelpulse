export const runtime = "nodejs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const normalizePrivateKey = (value) => {
  if (!value || typeof value !== "string") {
    return undefined;
  }

  return value
    .trim()
    .replace(/^"(.*)"$/s, "$1")
    .replace(/^'(.*)'$/s, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "");
};

const privateKey = normalizePrivateKey(process.env.GCP_PRIVATE_KEY);
const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
const firestoreDatabaseId = process.env.FIRESTORE_DATABASE_ID || "pixelpulse";
const serviceAccount = {
  projectId,
  clientEmail: process.env.GCP_CLIENT_EMAIL,
  privateKey,
};

const hasFirebaseConfig =
  serviceAccount.projectId &&
  serviceAccount.clientEmail &&
  serviceAccount.privateKey;

if (hasFirebaseConfig && !getApps().length) {
  try {
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error("Firebase admin init failed:", error);
  }
}

export const db = hasFirebaseConfig ? getFirestore(undefined, firestoreDatabaseId) : null;
