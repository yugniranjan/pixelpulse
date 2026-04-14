// src/lib/firebaseAdmin.js
export const runtime = "nodejs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const privateKey = process.env.GCP_PRIVATE_KEY;
const serviceAccount =
  process.env.GCP_PROJECT_ID && process.env.GCP_CLIENT_EMAIL && privateKey
    ? {
        projectId: process.env.GCP_PROJECT_ID,
        clientEmail: process.env.GCP_CLIENT_EMAIL,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }
    : null;

if (serviceAccount && !getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const db = serviceAccount ? getFirestore(undefined, "pixelpulse") : null;
