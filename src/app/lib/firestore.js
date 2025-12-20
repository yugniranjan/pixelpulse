// src/lib/firebaseAdmin.js
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = {
  projectId: process.env.GCP_PROJECT_ID,
  clientEmail: process.env.GCP_CLIENT_EMAIL,
  privateKey: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, "\n"),
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const db = getFirestore( undefined , 'pixelpulse');
