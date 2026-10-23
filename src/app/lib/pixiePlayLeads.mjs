import { formatPhoneNumber } from './phone.mjs';

export const PIXIE_LEAD_CONSENT = 'I agree Pixel Pulse may contact me about my enquiry using these details.';
export const PIXIE_LEAD_HEADERS = ['Submission ID', 'Submitted (Toronto)', 'Full name', 'Email', 'Phone', 'Page', 'Chatbot version', 'Follow-up consent', 'Submitted (UTC)'];
export class PixieLeadError extends Error {
  constructor(message, status = 400, code = 'validation') { super(message); this.status = status; this.code = code; }
}
export function validatePixieLead(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new PixieLeadError('Please complete your contact details.');
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (name.length < 2 || name.length > 100 || /[\x00-\x1f\x7f]/.test(name)) throw new PixieLeadError('Please enter your full name.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new PixieLeadError('Please enter a valid email address.');
  const digits = phone.replace(/\D/g, '');
  const validPhone = /^[+\d\s().-]+$/.test(phone) && (digits.length === 10 || (digits.length === 11 && digits.startsWith('1')) || (phone.startsWith('+') && digits.length >= 8 && digits.length <= 15));
  if (!validPhone || phone.length > 35) throw new PixieLeadError('Please enter a valid phone number.');
  if (body.consent !== true) throw new PixieLeadError('Please confirm that our team can follow up about your enquiry.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.submissionId || '')) throw new PixieLeadError('Please refresh the chat and try again.');
  return { name, email, phone: formatPhoneNumber(phone), submissionId: body.submissionId.toLowerCase(), consent: true, variant: body.variant === 'birthday' ? 'birthday' : 'default', page: body.page === '/birthday-party-landing' ? '/birthday-party-landing' : '/' };
}
export function pixieLeadRow(lead, now = new Date()) {
  const local = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZoneName: 'short' }).format(now);
  return [lead.submissionId, local, lead.name, lead.email, lead.phone, lead.page, lead.variant, PIXIE_LEAD_CONSENT, now.toISOString()];
}
