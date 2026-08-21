import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

function parseEnvironmentYaml(contents) {
  return Object.fromEntries(
    contents
      .split(/\r?\n/)
      .map((line) => line.match(/^\s{2}([A-Z0-9_]+):\s+"(.*)"\s*$/))
      .filter(Boolean)
      .map(([, key, value]) => [key, JSON.parse(`"${value}"`)]),
  );
}

async function loadAppEnvironment() {
  if (!process.env.GAE_ENV) {
    return;
  }

  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.GCP_PROJECT_ID;
  const secretName = process.env.APP_ENV_SECRET_NAME;

  if (!projectId || !secretName) {
    throw new Error("Secret Manager project and secret name are required");
  }

  const client = new SecretManagerServiceClient();
  const [version] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
  });
  const environment = parseEnvironmentYaml(version.payload?.data?.toString("utf8") || "");

  for (const [key, value] of Object.entries(environment)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

await loadAppEnvironment();
await import("../.next/standalone/server.js");