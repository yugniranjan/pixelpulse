import { GoogleAuth } from 'google-auth-library';
import { getPostgresPool } from './postgres.js';
import { PIXIE_LEAD_HEADERS, pixieLeadRow, PixieLeadError } from './pixiePlayLeads.mjs';

export const PIXIE_LEADS_SHEET_ID = '1J6714Gun2dj_fTWHsYlWbuzSzZyUC-HrAVnWgGEmNzs';
const TAB = 'PixiePlay Leads';
let auth;
function googleAuth() {
  if (!auth) {
    const { GCP_CLIENT_EMAIL: email, GCP_PRIVATE_KEY: key } = process.env;
    auth = new GoogleAuth({ ...(email && key ? { credentials: { client_email: email, private_key: key.replace(/\\n/g, '\n') } } : {}), scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.metadata.readonly'] });
  }
  return auth;
}
export async function savePixieLead(lead) {
  const pool = getPostgresPool();
  if (!pool) throw new PixieLeadError('We couldn’t save your details. Please try again or contact our team.', 503, 'save_failed');
  const connection = await pool.connect();
  try {
    // Cross-instance retry protection. No lead data is stored in PostgreSQL.
    await connection.query('BEGIN');
    await connection.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`pixie-lead:${lead.submissionId}`]);
    const client = await googleAuth().getClient();
    const privacy = await client.request({ url: `https://www.googleapis.com/drive/v3/files/${PIXIE_LEADS_SHEET_ID}?fields=permissions(type,role)`, timeout: 10000, retry: false });
    if (!Array.isArray(privacy.data.permissions) || privacy.data.permissions.some((permission) => ['anyone', 'domain'].includes(permission.type))) throw new Error('Lead sheet must remain private');
    const root = `https://sheets.googleapis.com/v4/spreadsheets/${PIXIE_LEADS_SHEET_ID}`;
    const request = async (range, options = {}) => (await client.request({ url: `${root}/values/${encodeURIComponent(`'${TAB}'!${range}`)}`, timeout: 10000, retry: false, ...options })).data;
    const header = await request('A1:I1');
    if (JSON.stringify(header.values?.[0]) !== JSON.stringify(PIXIE_LEAD_HEADERS)) throw new Error('Lead sheet headers changed');
    const ids = await request('A2:A');
    const duplicate = ids.values?.some((row) => row[0] === lead.submissionId) || false;
    if (!duplicate) {
      await request('A:I', { url: `${root}/values/${encodeURIComponent(`'${TAB}'!A:I`)}:append?valueInputOption=RAW&insertDataOption=OVERWRITE`, method: 'POST', data: { majorDimension: 'ROWS', values: [pixieLeadRow(lead)] } });
    }
    await connection.query('COMMIT');
    return { saved: true, duplicate };
  } catch {
    await connection.query('ROLLBACK').catch(() => {});
    // Avoid logging Google request objects, which contain tokens and contact data.
    throw new PixieLeadError('We couldn’t save your details. Please try again or contact our team.', 503, 'save_failed');
  } finally { connection.release(); }
}
