export const runtime = "nodejs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = {
  projectId: process.env.GCP_PROJECT_ID,
  clientEmail: process.env.GCP_CLIENT_EMAIL,
  privateKey: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const hasFirestoreCredentials = Boolean(
  serviceAccount.projectId &&
    serviceAccount.clientEmail &&
    serviceAccount.privateKey?.startsWith("-----BEGIN PRIVATE KEY-----"),
);

if (hasFirestoreCredentials && !getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const db = hasFirestoreCredentials
  ? getFirestore(undefined, process.env.FIRESTORE_DATABASE_ID || "pixelpulse")
  : null;
