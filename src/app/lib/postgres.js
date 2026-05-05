import pg from "pg";

const { Pool } = pg;

let pool;

export function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const username = process.env.DATABASE_USERNAME;
  const password = process.env.DATABASE_PASSWORD;
  const host = process.env.DATABASE_HOST;
  const port = process.env.DATABASE_PORT || "5432";
  const database = process.env.DATABASE_DATABASE;

  if (!username || !password || !host || !database) {
    return "";
  }

  return `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
}

export function getPostgresPool() {
  const connectionString = getDatabaseUrl();

  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl:
        process.env.POSTGRES_SSL === "false"
          ? false
          : { rejectUnauthorized: false },
    });
  }

  return pool;
}

export async function query(text, params = []) {
  const postgres = getPostgresPool();

  if (!postgres) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return postgres.query(text, params);
}
