export const BIRTHDAY_DEPOSIT_AMOUNT = 200;
export const BIRTHDAY_DEPOSIT_LABEL = `$${BIRTHDAY_DEPOSIT_AMOUNT}`;
export const BIRTHDAY_PAYMENT_EMAIL = 'connect@pixelpulseplay.ca';
export const BIRTHDAY_DEPOSIT_NOTICE = `A ${BIRTHDAY_DEPOSIT_LABEL} deposit is required for all birthday packages.`;
export const BIRTHDAY_TRANSFER_NOTICE = `E-transfers can be sent to ${BIRTHDAY_PAYMENT_EMAIL}.`;
export const BIRTHDAY_DEPOSIT_ANSWER = `The deposit is ${BIRTHDAY_DEPOSIT_LABEL} for all birthday packages, including Pixel Punch, Pixel Ultra, Pixel Jumbo and Pulse Max. ${BIRTHDAY_TRANSFER_NOTICE} Our team confirms your reservation after checking availability and verifying the payment.`;

// Apply only to birthday content: package prices and unrelated dollar amounts
// stay intact while legacy deposit copy follows the current business policy.
export function normalizeBirthdayDepositText(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/(\bdeposit\b[^.!?;\n$]{0,35})\$\s*[\d,]+(?:\.\d{1,2})?/gi, (_, prefix) => `${prefix}${BIRTHDAY_DEPOSIT_LABEL}`)
    .replace(/\$\s*[\d,]+(?:\.\d{1,2})?(\s+(?:non[- ]refundable\s+)?deposit\b)/gi, (_, suffix) => `${BIRTHDAY_DEPOSIT_LABEL}${suffix}`)
    .replace(/\bdeposit(?:\s+of)?\s+(?:is\s+)?required\b/gi, `deposit of ${BIRTHDAY_DEPOSIT_LABEL} is required`);
}
