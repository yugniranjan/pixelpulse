import { getPixiePlayReply, PIXIE_EVENTS_URL } from './pixiePlay.mjs';

const contact = { label: 'Contact our team', href: '/contactus' };
const packages = { label: 'Compare birthday packages', href: '/kids-birthday-parties' };
const birthdayForm = { label: 'Request a birthday party', href: 'https://birthdays.pixelpulseplay.ca/#birthday-party-form' };
const events = { label: 'Enquire about your event', href: PIXIE_EVENTS_URL };

// Keep each conversational step focused: an answer, one relevant destination,
// and optional questions about the same subject. Never auto-start the planner
// just because a visitor mentions a birthday in an informational question.
export function getPixieFlowReply(message, knowledge = {}, previousTopic = '') {
  const answer = getPixiePlayReply(message, knowledge, previousTopic);
  const text = String(message).toLowerCase().replace(/[’']/g, '');
  const startPlanning = !/\b(dont|do not|not ready|stop|cancel)\b/.test(text)
    && /\b(plan (?:a |my |our |the )?birthday|help (?:me |us )?(?:to )?plan.*birthday|birthday (?:party )?planner)\b/.test(text);
  let action = answer.links?.[0];
  let questions = [];

  if (!answer.topic) return { ...answer, links: [], questions, startPlanning: false };
  if (answer.topic === 'team') {
    action = contact;
  } else if (answer.topic === 'waiver') {
    questions = ['Check waiver status', 'Complete a waiver'];
  } else if (/\b(deposits?|e.transfer|etransfer|balance|payments?|hst|tax)\b/.test(text)) {
    action = answer.links?.find((link) => link.href.startsWith('mailto:')) || contact;
    questions = ['Deposit & payment', 'Change my booking'];
  } else if (/\b(cakes?|pizzas?|food|snacks?|drinks?|beverages?|catering|refreshments?|toppings?)\b/.test(text)) {
    action = answer.topic === 'events' ? events : { label: 'Ask about food requests', href: '/contactus' };
    questions = answer.topic === 'events' ? ['Private venue booking', 'Group sizes'] : ['Pizza choices', 'Party room setup'];
  } else if (answer.topic === 'events') {
    action = events;
    questions = ['Private venue booking', 'Group sizes'];
  } else if (answer.topic === 'existing') {
    questions = ['Check waiver status', 'Arrival time'];
  } else if (answer.topic === 'birthday') {
    action = /\b(book|reserve|reservation|request)\b/.test(text)
      ? birthdayForm : /\b(packages?|prices?|pricing|cost|punch|ultra|jumbo|max)\b/.test(text) ? packages
      : /\b(availability|available|date)\b/.test(text) ? birthdayForm : contact;
    questions = /\b(room|time|duration|long|extend)\b/.test(text)
      ? ['Party duration', 'Extra gameplay time'] : ['Plan a birthday', 'Deposit & payment'];
  } else if (answer.topic === 'play' || answer.topic === 'visit') {
    questions = ['How does it work?', 'Age requirements'];
  }
  if (startPlanning) { action = undefined; questions = []; }
  return { ...answer, ...(startPlanning ? { text: 'Let’s plan your birthday. Start with the number of children who will play.' } : {}), links: action ? [action] : [], questions, startPlanning };
}
