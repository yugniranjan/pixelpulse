import { Storage } from "@google-cloud/storage";

const privateKey = process.env.GCP_PRIVATE_KEY;
const credentials =
  process.env.GCP_CLIENT_EMAIL && privateKey
    ? {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key: privateKey.replace(/\\n/g, "\n"),
      }
    : null;

const storage =
  process.env.GCP_PROJECT_ID && credentials
    ? new Storage({
        projectId: process.env.GCP_PROJECT_ID,
        credentials,
      })
    : null;

export const bucket =
  storage && process.env.GCS_BUCKET_NAME
    ? storage.bucket(process.env.GCS_BUCKET_NAME)
    : null;
