import { getPixieKnowledgeReply } from './pixiePlayAnswers.mjs';

export const PIXIE_PROMPTS = ["Plan a birthday", "Corporate or group event", "I already have a booking", "I have a question"];
export const PIXIE_EVENTS_URL = 'https://events.pixelpulseplay.ca';
export const PIXIE_QUESTIONS = {
  birthday: ['Plan a birthday', 'Birthday packages', 'Party duration', 'How do children play?', 'Small birthday groups', 'Food & cake', 'Arcade games', 'Age requirements', 'Deposit & payment', 'Birthday promotions'],
  events: ['Private venue booking', 'Group sizes', 'Food & refreshments'],
  existing: ['Check waiver status', 'Complete a waiver', 'Birthday invitations', 'Arrival time', 'Change my booking', 'Food & cake', 'Contact the team'],
  waiver: ['Check waiver status', 'Complete a waiver', 'Contact the team'],
  faq: ['Book play time', 'Hours & location', 'How does it work?', 'Age requirements', 'Arcade games', 'Can we visit before booking?'],
};

export const PIXIE_PARTY_OPTIONS = {
  guests: ['4–7', '8–12', '13–20', '20+'],
  ages: ['7–10', '11–14', '15+'],
  privacy: ['Standard birthday package', 'Private venue booking', 'Help me choose'],
};

export function pixieText(value = "") {
  return String(value).replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#0?39;|&apos;/gi, "'")
    .replace(/\s+/g, " ").replace(/\s+([.,!?;:])/g, "$1").trim();
}

export function buildPixiePlayKnowledge(rows = [], address = "") {
  return {
    address: pixieText(address),
    faqs: (Array.isArray(rows) ? rows : [])
      .filter((row) => typeof row.question === "string" && typeof row.answer === "string")
      .map((row) => ({ question: pixieText(row.question).slice(0, 300), answer: pixieText(row.answer).slice(0, 2000) }))
      .filter((row) => row.question && row.answer).slice(0, 50),
  };
}

const teamLinks = [
  { label: "Contact our team", href: "/contactus" },
  { label: "Call (905)-760-2922", href: "tel:+19057602922" },
];
const birthdayLinks = [
  { label: "Explore birthday packages", href: "/kids-birthday-parties" },
  { label: "Request a birthday party", href: "https://birthdays.pixelpulseplay.ca/#birthday-party-form" },
];
const waiverStatusLink = { label: 'Check party waiver status', href: 'https://pixelpulseplay.ca/party-dashboard' };

export function getPixiePartyPlan({ guests, age, date, privacy }) {
  if (!PIXIE_PARTY_OPTIONS.guests.includes(guests) || !PIXIE_PARTY_OPTIONS.ages.includes(age) || !PIXIE_PARTY_OPTIONS.privacy.includes(privacy) || typeof date !== 'string') return null;
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const parsed = new Date(`${date}T12:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return null;
  }
  const summary = `${guests} children · Ages ${age} · ${date || 'Date to be decided'} · ${privacy}`;
  const privateBooking = privacy === 'Private venue booking';
  const needsTeam = guests === '4–7' || guests === '20+';
  const next = privateBooking
    ? 'For exclusive venue access, request a private event quote from our team.'
    : needsTeam
      ? 'Ask our team to confirm the right option for your group size and ages.'
      : 'Compare our current birthday packages and send a party request with your preferred date.';
  const formUrl = new URL('https://birthdays.pixelpulseplay.ca/');
  if (date) formUrl.searchParams.set('partyDate', date);
  formUrl.searchParams.set('partyDetails', `PixiePlay party enquiry: ${summary}`);
  formUrl.hash = 'birthday-party-form';
  return {
    text: `Your party plan 🎉\n${summary}\n\n${next} Availability, pricing, and the final schedule are confirmed by our team.`,
    links: privateBooking ? [{ label: 'Request a private event', href: PIXIE_EVENTS_URL }, teamLinks[0]] : [{ label: 'Continue to birthday enquiry', href: formUrl.href }, birthdayLinks[0]],
    topic: 'birthday',
  };
}

function tokens(value) {
  const stop = new Set(["i", "a", "an", "the", "can", "is", "are", "do", "does", "to", "of", "for", "in", "at", "on", "and", "my", "we", "you", "your", "our", "it", "what", "how", "with", "have", "be"]);
  return new Set(pixieText(value).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 1 && !stop.has(word)));
}

export function getPixiePlayReply(message, { faqs = [], address = "" } = {}, previousTopic = "") {
  const text = pixieText(message).toLowerCase();
  const reply = (text, links = [], topic = "") => ({ text, links, topic });
  if (!text || text.length > 600) return reply("Ask me a short question about your Pixel Pulse visit, a birthday party, or booking play time.", [], previousTopic);

  if (/who are you|are you (a |an )?(real|human|person|bot|robot|ai)/.test(text)) {
    return reply("I’m PixiePlay, the automated Pixel Pulse FAQ guide. I can help you find visit information and booking links. If you need a person, contact our team.", teamLinks, "team");
  }

  if (/\b(allerg|medical|pregnan|disabil|accessib|wheelchair|injur|epilep)/.test(text)) {
    return reply("Please check with our team before booking so they can discuss your needs and the activities or food involved in your visit.", teamLinks, "team");
  }
  if (/\b(refund|cancel|reschedul|change my|complaint|lost|double charge|guarantee)/.test(text)) {
    return reply("Our team can help with booking changes, payments, refunds, or anything specific to your visit. Contact them directly so they can check your details.", teamLinks, "team");
  }
  const knowledgeAnswer = getPixieKnowledgeReply(text, { address: pixieText(address) });
  if (knowledgeAnswer) return knowledgeAnswer;

  if (/\b(refund|cancel|reschedul|change my|human|person|staff|complaint|lost|payment|charged|double charge|guarantee)/.test(text)) {
    return reply("Our team can help with booking changes, payments, refunds, or anything specific to your visit. Contact them directly so they can check your details.", teamLinks, "team");
  }
  if (/party dashboard/.test(text) || (/\bwaivers?\b/.test(text) && /\b(check|status|count|signed|submitted|completed|filled|received|track|view|missing|remaining|pending)\b|how many/.test(text))) {
    return reply('You can check your party’s signed waivers and covered participants on the party dashboard. Enter your party ID there to view the status.', [waiverStatusLink], 'waiver');
  }
  if (/already (have|booked)|existing booking|manage.*booking/.test(text)) {
    return reply('Already booked? I can help with waivers, invitations, food choices, arrival information, and contacting your party coordinator. Check signed waivers on the party dashboard using your party ID. For changes, payments, or your confirmed schedule, contact our team.', [waiverStatusLink, { label: 'Complete a waiver', href: '/waiver' }, teamLinks[0]], 'existing');
  }
  if (/i have a question|general questions?/.test(text)) {
    return reply('Ask about gameplay, ages, arcade games, food, hours, or booking play time. Choose a question below or type your own.', [{ label: 'Book play time', href: '/booking?type=ticket' }, { label: 'Read our FAQs', href: '/faqs' }], 'faq');
  }
  if (/\b(invite|invites|invitation|invitations|rsvp)\b/.test(text)) {
    return reply('For a confirmed birthday party, contact your party coordinator about a digital invitation and the RSVP details you would like included. Share your party ID directly with the team.', teamLinks, 'existing');
  }
  if (/\b(arriv|check.?in)/.test(text)) {
    return reply('For a birthday party, please arrive 15 minutes before your reserved time for check-in. Every participant needs a completed waiver before playing. Your party confirmation contains your reserved schedule.', [{ label: 'Complete a waiver', href: '/waiver' }, teamLinks[0]], 'existing');
  }
  if (/\b(arcade|arcades|tokens?|coins?|game cards?)\b/.test(text)) {
    return reply('Arcade games are separate from the challenge-room gameplay included in birthday packages. Arcade cards are available separately; check with our team for current card options and prices.', [...birthdayLinks.slice(0, 1), teamLinks[0]], 'birthday');
  }
  if (/buy\s*(2|two).*get\s*(2|two)|\b(promotion|promotions|discounts?)\b/.test(text)) {
    return reply('Promotions and birthday packages have their own terms. Check the current offer details and ask our team to confirm eligibility before combining a promotion with a party booking.', [{ label: 'Current pricing & promotions', href: '/pricing-promos' }, teamLinks[0]], previousTopic === 'birthday' || /birthday|party/.test(text) ? 'birthday' : 'pricing');
  }
  if (/\b(duration|party room time|game time|how long|schedule|resume|eat.*play)\b/.test(text)) {
    return reply('Total party duration, gameplay time, and party-room access are separate parts of each birthday package. Compare the listed times on our birthday page. Our team will confirm the pizza, cake, and gameplay schedule, including any request to split play time.', birthdayLinks, 'birthday');
  }
  if (/\b(small|minimum|fewer|non.?playing|spectators?)\b|\b[4-6]\s*(children|kids|players)/.test(text)) {
    return reply('Planning a smaller birthday group, or bringing adults and children who will not play? Tell our team the number of playing participants and accompanying guests separately. They can confirm the appropriate package, minimums, and any charges.', [...birthdayLinks, teamLinks[0]], 'birthday');
  }
  if (/\b(age|old|height|toddler|baby|babies|young|under 7)\b/.test(text)) {
    return reply('Our birthday experiences are designed for ages 7 and above. For younger children, ask our team about suitable activities and adult assistance before booking. Let them know who will play and who will only attend.', [{ label: 'Read player FAQs', href: '/faqs' }, teamLinks[0]], 'visit');
  }
  if (/visit before|venue tour|tour.*venue|see the (venue|facility)/.test(text)) {
    return reply('You can ask our team about visiting the venue before booking. Check current operating hours and arrange a suitable time with them before coming in.', teamLinks, 'visit');
  }
  if (/\b(decorat|slideshow|projector|customiz|customis|special arrangement)/.test(text)) {
    return reply('Tell our team about your decorations, slideshow, or special arrangement when you enquire. They will confirm what is possible for your party room and booking.', teamLinks, 'birthday');
  }
  if (/\b(email|contact|call|phone)\b/.test(text)) {
    return reply("You can reach the Pixel Pulse team at connect@pixelpulseplay.ca or (905)-760-2922.", [...teamLinks, { label: "Email our team", href: "mailto:connect@pixelpulseplay.ca" }], "team");
  }
  if (/\b(waivers?|consent|guardian)\b/.test(text)) {
    return reply("Every participant needs a completed waiver before playing. You can complete it online before arriving to help check-in go smoothly. To check signed waivers for a party, open the party dashboard and enter your party ID.", [{ label: "Complete your waiver", href: "/waiver" }, waiverStatusLink], "waiver");
  }
  if (/\b(cake|pizza|food|snack|drink|catering|refreshment)/.test(text)) {
    return reply("For birthday parties, outside cake, dry snacks, and non-alcoholic beverages are welcome. The party packages list their included pizza and beverages. Check with our team about any specific food requests.", birthdayLinks, "birthday");
  }
  if (/\b(private|corporate|fundrais|team building|group event)/.test(text)) {
    if (/\bbirthday|\bpackages?\b/.test(text)) {
      return reply("Birthday packages include your own dedicated party room, but they run during regular opening hours and don’t reserve the whole facility. For a private facility event, contact our team about a custom package.", [...birthdayLinks.slice(0, 1), { label: "Ask about a private event", href: PIXIE_EVENTS_URL }], "birthday");
    }
    return reply("Planning a private party, team event, or group celebration? Include your group size, preferred date, duration, food requirements, and whether you need exclusive venue access in the events enquiry. Our team will confirm options, pricing, and availability.", [{ label: "Plan a group event", href: PIXIE_EVENTS_URL }], "events");
  }
  if (/\b(hours?|open|opening|close|closing|location|address|where|directions?|parking)\b/.test(text)) {
    const location = pixieText(address);
    return reply(`${location ? `You’ll find Pixel Pulse Play at ${location}.` : "Pixel Pulse Play is in Vaughan, Ontario."} Visit our contact page for location details and check with our team for hours on your planned visit date.`, [{ label: "Hours & location", href: "/contactus" }, teamLinks[1]], "visit");
  }
  if (/\b(children play|rotate|rotation|all 13|together|group sizes?|at once|fit in a room)\b/.test(text)) {
    return reply('Birthday groups rotate between the 13 challenge rooms during their scheduled gameplay. Many rooms accommodate teams of up to five players; capacity varies by room. Our team guides the rotation. Trying every room depends on your play time, room traffic and how quickly your group progresses.', [{ label: 'See how to play', href: '/how-to-play' }, birthdayLinks[0]], 'play');
  }
  const asksPrice = /\b(prices?|pricing|costs?|much|rates?|deals?|discounts?|offers?|expensive|cheap)\b/.test(text);
  const asksBirthday = /\b(birthdays?|party|parties|punch|ultra|jumbo|pulse max|packages?)\b/.test(text);
  if (asksBirthday || (previousTopic === "birthday" && asksPrice)) {
    return reply(asksPrice
      ? "You can compare the current prices and inclusions for Pixel Punch, Pixel Ultra, Pixel Jumbo, and Pulse Max on our birthday page. Send a party request and our team will confirm availability."
      : "Let’s plan a birthday! Choose from Pixel Punch, Pixel Ultra, Pixel Jumbo, or Pulse Max. Packages combine challenge-room play with your own dedicated party room, a host, and the listed food and drinks. Send a request with your preferred date to get started.", birthdayLinks, "birthday");
  }
  if (asksPrice) return reply("See our current pricing and promotions, or open the booking page to choose play time and check the available options for your visit.", [{ label: "See pricing & promotions", href: "/pricing-promos" }, { label: "Book play time", href: "/booking?type=ticket" }], "pricing");
  if (/\b(book|bookings?|tickets?|reserve|reservations?|availability|available|walk.?ins?)\b/.test(text)) {
    return reply("Ready to play? Open our booking page to choose play time and view the available booking options. For a birthday party, use the party request form instead.", [{ label: "Book play time", href: "/booking?type=ticket" }, birthdayLinks[1]], "booking");
  }
  if (/\b(wear|clothes|clothing|shoe|dress)\b/.test(text)) {
    return reply("Wear comfortable clothing and closed-toe shoes so you’re ready to move through the challenge rooms.", [{ label: "Plan your visit", href: "/how-to-play" }], "play");
  }
  if (/how (does|do|to)|\b(game|games|wristband|score|scoring|challenge|work|works)\b/.test(text)) {
    return reply("Check in, collect your wristband, and get a quick briefing. Tap your wristband to start a challenge, play with your group, and build your score. You can replay rooms and try different game variants during your play time.", [{ label: "Watch how to play", href: "/how-to-play" }, { label: "Explore the games", href: "/attractions" }], "play");
  }
  if (/^(hi|hey|hello|hiya|good morning|good evening)[.!\s]*$/.test(text)) return reply("Hi! I’m PixiePlay, your Pixel Pulse guide. I can help with birthday parties, booking play time, waivers, and planning your visit. What would you like to know?");
  if (/^(thanks|thank you|cheers|great|awesome)[.!\s]*$/.test(text)) return reply("You’re welcome! Ready for your next challenge?", [{ label: "Book play time", href: "/booking?type=ticket" }]);

  // Only answer from a supplied FAQ when several meaningful words match.
  const query = tokens(text);
  const matches = faqs.map((faq) => {
    const words = tokens(faq.question);
    const overlap = [...query].filter((word) => words.has(word)).length;
    return { faq, overlap, score: overlap / Math.max(query.size, words.size, 1) };
  }).filter((item) => item.overlap >= 2 && item.score >= 0.55).sort((a, b) => b.score - a.score);
  if (matches.length) return reply(pixieText(matches[0].faq.answer), [{ label: "Read our FAQs", href: "/faqs" }], "faq");

  return reply("I can help with bookings, birthdays, waivers, and how to play. For that question, our team can give you a more specific answer.", teamLinks, "team");
}
