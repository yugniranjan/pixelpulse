// src/lib/firebaseAdmin.js
export const runtime = "nodejs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const privateKey = process.env.GCP_PRIVATE_KEY;
const serviceAccount = {
  projectId: process.env.GCP_PROJECT_ID,
  clientEmail: process.env.GCP_CLIENT_EMAIL,
  privateKey: privateKey ? privateKey.replace(/\\n/g, "\n") : undefined,
};

const hasFirebaseConfig =
  serviceAccount.projectId &&
  serviceAccount.clientEmail &&
  serviceAccount.privateKey;

if (hasFirebaseConfig && !getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const db = hasFirebaseConfig ? getFirestore(undefined, "pixelpulse") : null;
