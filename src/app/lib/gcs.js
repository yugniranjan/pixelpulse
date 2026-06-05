import { Storage } from "@google-cloud/storage";

const hasStorageConfig =
  process.env.GCP_PROJECT_ID &&
  process.env.GCP_CLIENT_EMAIL &&
  process.env.GCP_PRIVATE_KEY &&
  process.env.GCS_BUCKET_NAME;

const storage = hasStorageConfig
  ? new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      credentials: {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
    })
  : null;

export const bucket = storage ? storage.bucket(process.env.GCS_BUCKET_NAME) : null;
