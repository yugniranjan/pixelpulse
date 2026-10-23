export const PIXIE_LEAD_CONSENT = 'I agree Pixel Pulse may contact me about my enquiry using these details.';
export const PIXIE_LEAD_HEADERS = ['Submission ID', 'Submitted (EST)', 'Full name', 'Email', 'Phone', 'Page', 'Chatbot version', 'Follow-up consent', 'Submitted (UTC)'];
export class PixieLeadError extends Error {
  constructor(message, status = 400, code = 'validation') { super(message); this.status = status; this.code = code; }
}
export function validatePixieLead(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new PixieLeadError('Please complete your contact details.');
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (name.length < 2 || name.length > 100 || /[\x00-\x1f\x7f]/.test(name)) throw new PixieLeadError('Please enter your full name.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new PixieLeadError('Please enter a valid email address.');
  if (body.consent !== true) throw new PixieLeadError('Please confirm that our team can follow up about your enquiry.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.submissionId || '')) throw new PixieLeadError('Please refresh the chat and try again.');
  return { name, email, submissionId: body.submissionId.toLowerCase(), consent: true, variant: body.variant === 'birthday' ? 'birthday' : 'default', page: body.page === '/birthday-party-landing' ? '/birthday-party-landing' : '/' };
}
export function matchesPixieLeadHeaders(row) {
  // Accept the deployed legacy label during the zero-downtime sheet migration.
  return Array.isArray(row) && row.length === PIXIE_LEAD_HEADERS.length
    && row.every((value, index) => index === 1
      ? ['Submitted (EST)', 'Submitted (Toronto)'].includes(value)
      : value === PIXIE_LEAD_HEADERS[index]);
}
export function formatPixieLeadEST(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Etc/GMT+5', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}, ${values.hour}:${values.minute}:${values.second} EST`;
}
export function pixieLeadRow(lead, now = new Date()) {
  // Keep the historic phone column in place, but never collect/store new numbers.
  return [lead.submissionId, formatPixieLeadEST(now), lead.name, lead.email, '', lead.page, lead.variant, PIXIE_LEAD_CONSENT, now.toISOString()];
}
