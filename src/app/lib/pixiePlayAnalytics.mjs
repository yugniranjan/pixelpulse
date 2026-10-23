// Existing GA4 destination verified in the public GTM-53N567VP container.
const PIXIE_GA4_DESTINATION = 'G-C6K82QG464';
const EVENTS = new Set(['pixieplay_open', 'pixieplay_close', 'pixieplay_reset', 'pixieplay_lead_form_view', 'generate_lead', 'pixieplay_lead_error', 'pixieplay_question', 'pixieplay_planner_start', 'pixieplay_planner_complete', 'pixieplay_link_click']);
const TOPICS = new Set(['team', 'waiver', 'events', 'existing', 'birthday', 'play', 'visit', 'faq', 'pricing', 'hours', 'arcade']);
const DESTINATIONS = new Set(['birthday_booking', 'play_booking', 'waiver_status', 'waiver_form', 'group_events', 'contact', 'packages', 'other']);
// Allowlisted categories only: never pass names, emails, phone numbers, questions,
// lead IDs, complete links or URL query strings to Google Analytics / GTM.
export function pixieAnalyticsPayload(event, details = {}) {
  if (!EVENTS.has(event)) return null;
  return {
    event,
    lead_source: 'pixieplay',
    chatbot_variant: details.variant === 'birthday' ? 'birthday' : 'default',
    ...(TOPICS.has(details.topic) ? { chatbot_topic: details.topic } : {}),
    ...(typeof details.answered === 'boolean' ? { answer_found: details.answered } : {}),
    ...(DESTINATIONS.has(details.destination) ? { chatbot_destination: details.destination } : {}),
    ...(['validation', 'verification', 'save_failed'].includes(details.error) ? { chatbot_error: details.error } : {}),
  };
}
export function trackPixiePlay(event, details = {}) {
  const payload = pixieAnalyticsPayload(event, details);
  if (!payload || typeof window === 'undefined') return;
  try {
    if (typeof window.gtag === 'function') {
      const { event: name, ...parameters } = payload;
      window.gtag('event', name, { ...parameters, send_to: PIXIE_GA4_DESTINATION });
    } else {
      window.dataLayer = window.dataLayer || [];
      // Google Tag installed through GTM also consumes gtag command arguments.
      // Target GA4 explicitly so the lead event isn't sent to Google Ads by default.
      const { event: name, ...parameters } = payload;
      (function () { window.dataLayer.push(arguments); })('event', name, { ...parameters, send_to: PIXIE_GA4_DESTINATION });
    }
  } catch { /* Analytics must never interrupt chat or lead capture. */ }
}
export function pixieLinkDestination(value) {
  try {
    const url = new URL(value, 'https://pixelpulseplay.ca');
    if (url.protocol === 'mailto:') return 'contact';
    if (url.hostname === 'birthdays.pixelpulseplay.ca') return 'birthday_booking';
    if (url.hostname === 'events.pixelpulseplay.ca') return 'group_events';
    if (!['pixelpulseplay.ca', 'www.pixelpulseplay.ca'].includes(url.hostname)) return url.hostname.endsWith('.lilypadpos.com') || url.hostname.endsWith('.lilypadpos.app') ? 'play_booking' : 'other';
    if (url.pathname === '/booking') return 'play_booking';
    if (url.pathname === '/party-dashboard') return 'waiver_status';
    if (url.pathname === '/waiver') return 'waiver_form';
    if (url.pathname === '/kids-birthday-parties') return 'packages';
    if (url.pathname === '/contactus' || url.protocol === 'mailto:') return 'contact';
    return 'other';
  } catch { return 'other'; }
}
