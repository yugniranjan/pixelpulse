// src/lib/firebaseAdmin.js
export const runtime = "nodejs";
import { initializeApp, cert, getApps, getApp, applicationDefault } from "firebase-admin/app";
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
const firestoreDatabaseId = process.env.FIRESTORE_DATABASE_ID;
const serviceAccount = {
  projectId,
  clientEmail: process.env.GCP_CLIENT_EMAIL,
  privateKey,
};

const hasFirebaseConfig =
  serviceAccount.projectId &&
  serviceAccount.clientEmail &&
  serviceAccount.privateKey;

if (!getApps().length) {
  if (hasFirebaseConfig) {
    try {
      initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
    } catch (error) {
      console.error("Firebase admin init failed:", error);
    }
  } else if (projectId) {
    initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }
}

const app = getApps().length ? getApp() : null;

export const db = app
  ? firestoreDatabaseId
    ? getFirestore(app, firestoreDatabaseId)
    : getFirestore(app)
  : null;
