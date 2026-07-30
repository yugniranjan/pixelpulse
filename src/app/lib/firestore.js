export const runtime = "nodejs";
import { initializeApp, applicationDefault, cert, getApps } from "firebase-admin/app";
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

const appProjectId =
  serviceAccount.projectId ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.GCP_PROJECT ||
  process.env.GAE_APPLICATION?.replace(/^.*~/, "") ||
  "";

const canUseApplicationDefault = Boolean(appProjectId);

if (!getApps().length) {
  if (hasFirestoreCredentials) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });
  } else if (canUseApplicationDefault) {
    initializeApp({
      credential: applicationDefault(),
      projectId: appProjectId,
    });
  }
}

export const db = hasFirestoreCredentials || canUseApplicationDefault
  ? getFirestore(undefined, process.env.FIRESTORE_DATABASE_ID || "pixelpulse")
  : null;
