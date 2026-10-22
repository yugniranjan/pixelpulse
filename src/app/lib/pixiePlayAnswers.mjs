// Customer-facing content adapted from the two supplied chatbot CSVs.
// Internal notes, historical prices and unverified policy promises are not bundled.
const answers = [
  {
    "id": "PPP-SUP-001",
    "question": "Can adults participate in the challenge rooms?",
    "answer": "Yes. Adults can join the challenges. Anyone using a player wristband counts as a participating player and may be charged according to the selected package.",
    "topic": "play"
  },
  {
    "id": "PPP-SUP-002",
    "question": "Are children supervised during the birthday party?",
    "answer": "Our party hosts can guide children through the games and help coordinate room rotations. Parents and guardians remain responsible for their children. Contact our team to confirm supervision arrangements for your group.",
    "topic": "visit"
  },
  {
    "id": "PPP-SUP-003",
    "question": "Do parents and other spectators count as paid participants?",
    "answer": "Please distinguish nonplaying adults and spectators from players when you enquire. Anyone who joins gameplay with a wristband counts as a player. Our team will confirm spectator charges and venue or party-room occupancy limits.",
    "topic": "visit"
  },
  {
    "id": "PPP-SUP-004",
    "question": "Can younger children attend without playing?",
    "answer": "Younger children may attend with a responsible adult, subject to venue capacity and activity requirements. Tell our team whether they will play so they can confirm suitable activities, supervision and any admission charges.",
    "topic": "visit"
  },
  {
    "id": "PPP-SUP-005",
    "question": "Can I add extra participants to my party?",
    "answer": "Additional players may be added if capacity allows. Please share your updated player count so we can confirm any additional charges before your event.",
    "topic": "birthday"
  },
  {
    "id": "PPP-SUP-006",
    "question": "Can we extend the gameplay time?",
    "answer": "Extra gameplay time may be available depending on the schedule. Tell us how many additional minutes you need, and our team will confirm availability and the total price.",
    "topic": "birthday"
  },
  {
    "id": "PPP-SUP-007",
    "question": "What pizza choices are available?",
    "answer": "Ask our team to confirm current pizza choices, including cheese or pepperoni. Share your preferred quantities before party day; other toppings and dietary requests need staff confirmation.",
    "topic": "birthday"
  },
  {
    "id": "PPP-SUP-008",
    "question": "How many pizzas are included, and can we add more?",
    "answer": "Pizza inclusions vary by package. We will confirm your included quantity in the booking details. Additional pizzas may be ordered for an extra charge; please request the quantity and toppings in advance.",
    "topic": "birthday"
  },
  {
    "id": "PPP-SUP-009",
    "question": "What is included in the party room setup?",
    "answer": "Ask our team to confirm the tables, tablecloths, disposable cutlery and other setup items included in your selected package. Request decorations, presentation equipment or specific arrangements in advance.",
    "topic": "birthday"
  },
  {
    "id": "PPP-SUP-010",
    "question": "Are package prices and add-ons subject to tax?",
    "answer": "Our quotes identify whether prices are before tax. Applicable HST will be shown in the final total before payment.",
    "topic": "birthday"
  },
  {
    "id": "PPP-SUP-011",
    "question": "Why does the waiver dashboard show more people than I invited?",
    "answer": "The waiver list can include parents, accompanying adults or multiple participants under one email, so its total may differ from the number of paid players. Review the names on your party dashboard and confirm the final playing count with our team.",
    "topic": "waiver"
  },
  {
    "id": "PPP-SUP-012",
    "question": "How do we complete the waivers?",
    "answer": "Please use the party-specific waiver link provided with your invitation or confirmation and have each required participant complete it before arrival. If the link is missing or not working, contact our team.",
    "topic": "waiver"
  },
  {
    "id": "PPP-SUP-013",
    "question": "What should we confirm before party day?",
    "answer": "Before your party, please confirm the date and start time; final playing participant count; birthday child’s name and age; pizza quantities and toppings; dietary or allergy concerns; preferred food and cake timing; waiver completion; RSVP contact; and any decorations, presentation or accessibility needs.",
    "topic": "existing"
  },
  {
    "id": "PPP-SUP-014",
    "question": "Can the children return to gameplay after pizza and cake?",
    "answer": "Our team may be able to arrange gameplay around your food schedule within your booked gameplay allowance. Request your preferred timing in advance so they can confirm the wristband and room arrangements. Pausing the timer or re-entry is not automatic.",
    "topic": "birthday"
  },
  {
    "id": "PPP-SUP-015",
    "question": "Can you host a large birthday, school, or corporate group?",
    "answer": "We welcome enquiries for larger groups and private events. Players generally rotate through the challenge rooms in smaller teams. Capacity, scheduling and private-use arrangements must be confirmed based on your exact attendee and player counts.",
    "topic": "events"
  },
  {
    "id": "PPP-SUP-016",
    "question": "Can 20 or more guests all play in the same room?",
    "answer": "Most challenge rooms are designed for small teams rather than one large group at once. The party team can help divide guests into groups and rotate them between activities.",
    "topic": "play"
  },
  {
    "id": "PPP-SUP-017",
    "question": "Can alcohol be served at our private event?",
    "answer": "Alcohol service is not automatically available or permitted. Contact our management team before making arrangements so they can review your event and confirm whether alcohol service is possible.",
    "topic": "events"
  },
  {
    "id": "PPP-SUP-018",
    "question": "I sent my deposit. Is my party confirmed?",
    "answer": "I cannot verify receipt of your deposit or confirm a reservation. Contact our team so they can match the payment to your booking. Send the booking name, event date and payment reference directly to them; do not share banking passwords or full card details in this chat.",
    "topic": "team"
  },
  {
    "id": "PPP-SUP-019",
    "question": "What payment methods are accepted for the remaining balance?",
    "answer": "E-transfers can be sent to connect@pixelpulseplay.ca. Please confirm the amount due and any other accepted payment methods with our team before your event, and follow the terms in your booking confirmation.",
    "topic": "existing"
  },
  {
    "id": "PPP-SUP-020",
    "question": "Can you confirm my date is held while my payment is pending?",
    "answer": "Contact our team to request a temporary hold and confirm any expiry or deposit requirements. I cannot place a hold or check live availability. Your date and time are not guaranteed until our team confirms the reservation.",
    "topic": "team"
  },
  {
    "id": "PPP-001",
    "question": "What is Pixel Pulse Play?",
    "answer": "Pixel Pulse Play is an interactive challenge-room experience where players tackle physical, mental and teamwork games. It is not a traditional escape room. Our birthday experiences can include guided gameplay and party space depending on your package.",
    "topic": "play"
  },
  {
    "id": "PPP-002",
    "question": "Where are you located?",
    "answer": "We are at 960 Edgeley Boulevard, Unit 2, Concord, Ontario L4K 4V4. Call (905)-760-2922 if you need directions.",
    "topic": "visit"
  },
  {
    "id": "PPP-003",
    "question": "Can I visit before booking?",
    "answer": "Yes, you can visit during published operating hours to view the venue. Please check current hours before coming; staff can help with a party tour when available.",
    "topic": "visit"
  },
  {
    "id": "PPP-004",
    "question": "What are your opening hours?",
    "answer": "Our hours can change by day or season. Please check our current Google Business listing or contact us before visiting.",
    "topic": "visit"
  },
  {
    "id": "PPP-005",
    "question": "How do the challenge rooms work?",
    "answer": "Players form small teams and choose challenges across 13 rooms. Our team helps explain the format and supports room rotation. Watch the How to Play guide: the How to Play guide below",
    "topic": "play"
  },
  {
    "id": "PPP-006",
    "question": "Can everyone play together in one room?",
    "answer": "Many challenge rooms accommodate teams of up to five players; capacity varies by room. Larger groups rotate through rooms in smaller teams. Our team can help organize rotations.",
    "topic": "play"
  },
  {
    "id": "PPP-007",
    "question": "Will children experience all 13 rooms?",
    "answer": "The party provides access to all 13 challenge rooms during the booked gameplay period. Guests can move among rooms; completing every challenge depends on available time, room traffic and team progress.",
    "topic": "play"
  },
  {
    "id": "PPP-008",
    "question": "How long is each game?",
    "answer": "Individual challenges often take a few minutes; duration varies by game and team. You can try different rooms within your booked gameplay time.",
    "topic": "play"
  },
  {
    "id": "PPP-009",
    "question": "Are games supervised?",
    "answer": "Our party team can guide participants and help organize rotations. Parents and guardians remain responsible for their children. Contact our team to confirm supervision arrangements for your group.",
    "topic": "visit"
  },
  {
    "id": "PPP-010",
    "question": "Are adults allowed to play?",
    "answer": "Yes. Adults can take part in challenges. If an adult uses a player wristband, they count as a paid participant unless your confirmed package states otherwise.",
    "topic": "play"
  },
  {
    "id": "PPP-011",
    "question": "What ages are suitable?",
    "answer": "Most challenges are best suited to ages seven and older. Younger children may join selected activities with adult assistance, subject to safety and activity requirements.",
    "topic": "visit"
  },
  {
    "id": "PPP-012",
    "question": "Can children under seven attend without paying?",
    "answer": "Tell our team how many younger children will attend and whether they will play. They will confirm suitable activities, supervision, admission charges and capacity before you book.",
    "topic": "visit"
  },
  {
    "id": "PPP-013",
    "question": "Do parents count toward the guest total?",
    "answer": "Please distinguish playing participants from accompanying parents when you enquire. Anyone playing with a wristband counts as a player; our team will confirm spectator charges and party-room occupancy limits.",
    "topic": "visit"
  },
  {
    "id": "PPP-014",
    "question": "What is the minimum number of children?",
    "answer": "For a smaller birthday group, tell our team how many children will play. They can confirm the appropriate package, minimums and whether a custom arrangement is available.",
    "topic": "birthday"
  },
  {
    "id": "PPP-015",
    "question": "What if extra children join?",
    "answer": "Additional players may be added if capacity allows. The price depends on the selected package. Please share your updated guest count before the party.",
    "topic": "birthday"
  },
  {
    "id": "PPP-016",
    "question": "What birthday packages are available?",
    "answer": "We offer birthday options for different group sizes, including smaller and larger celebrations. See current packages at our birthday packages page below, or share your guest count and preferred date for a recommendation.",
    "topic": "birthday"
  },
  {
    "id": "PPP-017",
    "question": "How much does a birthday party cost?",
    "answer": "Birthday pricing depends on your package, player count, duration and add-ons. Compare current package prices, then send your preferred date and guest count through the birthday enquiry form. Our team confirms availability and the full quote.",
    "topic": "birthday"
  },
  {
    "id": "PPP-018",
    "question": "How much for only six children?",
    "answer": "Planning for six children? Tell our team the player count and preferred gameplay duration. They will confirm whether a smaller-party arrangement is available and provide a tailored quote.",
    "topic": "birthday"
  },
  {
    "id": "PPP-019",
    "question": "Is there a weekday party discount?",
    "answer": "Ask our team about current weekday party offers for your chosen date and package. Any discount must be confirmed before booking.",
    "topic": "birthday"
  },
  {
    "id": "PPP-020",
    "question": "Can I apply Buy 2 Get 2 to a party package?",
    "answer": "Buy 2 Get 2 and birthday packages have their own terms. Check the current promotion details and ask our team to confirm eligibility before combining offers.",
    "topic": "birthday"
  },
  {
    "id": "PPP-021",
    "question": "Does the birthday child play free?",
    "answer": "Any birthday-child promotion is subject to its published terms, eligibility and end date. We can confirm whether an offer applies to your date and selected package.",
    "topic": "birthday"
  },
  {
    "id": "PPP-022",
    "question": "How long does a birthday party last?",
    "answer": "Total party duration, gameplay time and party-room access are separate parts of each package. Compare the current package details, and ask our team to confirm your gameplay, food, cake and room-access schedule.",
    "topic": "birthday"
  },
  {
    "id": "PPP-023",
    "question": "Is party room time additional to playtime?",
    "answer": "Party-room time is not automatically additional to gameplay. The total visit duration and room-access window depend on your selected package. Our team will confirm the schedule before booking.",
    "topic": "birthday"
  },
  {
    "id": "PPP-024",
    "question": "Can children return to games after eating?",
    "answer": "This may be possible if the remaining gameplay time and wristband setup allow it. Please tell our team your preferred game–food–game schedule in advance so it can be confirmed.",
    "topic": "birthday"
  },
  {
    "id": "PPP-025",
    "question": "Can we extend the game time?",
    "answer": "Extra playtime may be available at an additional cost if the schedule allows. Tell us how much extra time you need and we will check the price and availability.",
    "topic": "birthday"
  },
  {
    "id": "PPP-026",
    "question": "Can I arrive early to decorate?",
    "answer": "Early access and decoration setup are subject to party room readiness and the day’s bookings. Please request a setup time ahead of your event.",
    "topic": "birthday"
  },
  {
    "id": "PPP-027",
    "question": "Is pizza included?",
    "answer": "Pizza quantities depend on your package. We will confirm the included number of large pizzas and available topping choices in your quote and booking confirmation.",
    "topic": "birthday"
  },
  {
    "id": "PPP-028",
    "question": "What pizza flavours can we choose?",
    "answer": "Ask our team to confirm the current pizza toppings, including cheese or pepperoni, and any dietary requests. Share your preferred quantities before party day.",
    "topic": "birthday"
  },
  {
    "id": "PPP-029",
    "question": "Can we buy extra pizzas?",
    "answer": "Additional pizzas may be available for a surcharge. Tell us the quantity and preferred toppings for a confirmed quote.",
    "topic": "birthday"
  },
  {
    "id": "PPP-030",
    "question": "Are drinks included?",
    "answer": "Drinks may be included depending on your selected package. The confirmation will state whether water, juice or pop is included and for how many guests.",
    "topic": "birthday"
  },
  {
    "id": "PPP-031",
    "question": "Can we bring cake and outside food?",
    "answer": "For birthday parties, outside cake, dry snacks and non-alcoholic beverages are welcome. Please confirm other food, catering and dietary requests with our team; private events may have different arrangements.",
    "topic": "birthday"
  },
  {
    "id": "PPP-032",
    "question": "What is included in the party room setup?",
    "answer": "Ask our team to confirm the tables, tablecloths, disposable cutlery and other setup items included in your selected package. Request decorations or presentation equipment in advance.",
    "topic": "birthday"
  },
  {
    "id": "PPP-033",
    "question": "Can we display a slideshow or presentation?",
    "answer": "Send any slideshow or presentation request, including your file format, to our team in advance. They can confirm equipment availability and what can be arranged for your party.",
    "topic": "birthday"
  },
  {
    "id": "PPP-034",
    "question": "Are arcade games included?",
    "answer": "Arcade play is typically separate from challenge-room birthday package pricing. Arcade cards can be purchased at the venue.",
    "topic": "birthday"
  },
  {
    "id": "PPP-035",
    "question": "Do arcade games use tokens or coins?",
    "answer": "Our arcade games use prepaid-value cards, rather than traditional coin or token purchases.",
    "topic": "play"
  },
  {
    "id": "PPP-036",
    "question": "How much does an arcade card cost?",
    "answer": "Arcade card values and game prices are posted at the venue. Please check with our team for current card options and rates.",
    "topic": "birthday"
  },
  {
    "id": "PPP-037",
    "question": "Is my preferred birthday date available?",
    "answer": "Request your preferred birthday date and start time through the birthday enquiry form, including your package and approximate player count. I cannot check live availability or confirm a reservation; our team will confirm it with you.",
    "topic": "birthday"
  },
  {
    "id": "PPP-038",
    "question": "How do I reserve my date?",
    "answer": "Choose a birthday package and request your preferred date and time. Our team will confirm availability, deposit requirements and next steps before your booking is confirmed.",
    "topic": "birthday"
  },
  {
    "id": "PPP-039",
    "question": "Is a deposit required and how much?",
    "answer": "The deposit is $100 for Pixel Punch and $200 for all other birthday packages. E-transfers can be sent to connect@pixelpulseplay.ca. Our team confirms your reservation after checking availability and verifying the payment.",
    "topic": "birthday"
  },
  {
    "id": "PPP-040",
    "question": "How can I pay the remaining balance?",
    "answer": "E-transfers can be sent to connect@pixelpulseplay.ca. Please confirm the amount due and any other accepted payment methods with our team before your event, and follow the terms in your booking confirmation.",
    "topic": "existing"
  },
  {
    "id": "PPP-041",
    "question": "Are prices before or after tax?",
    "answer": "Our quotes identify whether prices are before tax. Applicable HST will be shown in the final total before payment.",
    "topic": "birthday"
  },
  {
    "id": "PPP-042",
    "question": "Can I change my date or cancel?",
    "answer": "We can review date changes or cancellations. Please share your booking reference and requested change; our team will explain availability and the applicable deposit and cancellation terms.",
    "topic": "team"
  },
  {
    "id": "PPP-043",
    "question": "Do you provide digital birthday invitations?",
    "answer": "Contact your party coordinator about a digital birthday invitation after booking. Confirm the birthday child’s name and age, party time and RSVP contact details directly with the team.",
    "topic": "existing"
  },
  {
    "id": "PPP-044",
    "question": "Can I add my phone number to the invitation?",
    "answer": "Ask your party coordinator to include your chosen RSVP phone number on the digital invitation. Share only the number you authorize guests to see, directly with the team.",
    "topic": "existing"
  },
  {
    "id": "PPP-045",
    "question": "Do guests need to complete waivers?",
    "answer": "Participants should complete their waivers before arrival. The invitation or confirmation can include your party-specific waiver link. Contact us if a link is missing.",
    "topic": "waiver"
  },
  {
    "id": "PPP-046",
    "question": "Why does my waiver dashboard show more guests than I invited?",
    "answer": "Waiver records may include parents or multiple participants under one email, so the waiver total can differ from the number of paid players. Review the participant names on your party dashboard and confirm the final playing count with our team.",
    "topic": "waiver"
  },
  {
    "id": "PPP-047",
    "question": "What should I confirm before party day?",
    "answer": "Please confirm your final paid-player count, pizza selections, dietary restrictions, preferred food time, birthday child’s name, waiver completion and any setup or invitation changes.",
    "topic": "existing"
  },
  {
    "id": "PPP-048",
    "question": "Can we book the entire venue privately?",
    "answer": "Private venue events can be requested for birthdays, family celebrations and team groups. Share your date, duration, total attendees, player count and catering needs through our events enquiry. Availability and exclusive access require team confirmation.",
    "topic": "events"
  },
  {
    "id": "PPP-049",
    "question": "Can you host 30–70 guests?",
    "answer": "We welcome enquiries for larger groups. Capacity, player counts and scheduling must be confirmed by our team; no specific attendee capacity is guaranteed. Players rotate through challenge rooms in smaller teams.",
    "topic": "events"
  },
  {
    "id": "PPP-050",
    "question": "Do you offer corporate team building?",
    "answer": "Our challenge rooms offer teamwork, problem-solving and friendly competition for corporate groups. Use our events enquiry to request play-only or food-inclusive options; our team confirms capacity, pricing and availability.",
    "topic": "events"
  },
  {
    "id": "PPP-051",
    "question": "Can we bring outside catering for a private event?",
    "answer": "Outside catering for a private event needs confirmation from our team. Include your proposed food service, setup needs and attendee count in the events enquiry so they can confirm permissions and arrangements.",
    "topic": "events"
  },
  {
    "id": "PPP-052",
    "question": "Can alcohol be served at a private event?",
    "answer": "Alcohol service is not automatically available or permitted. Contact our management team before making arrangements so they can review your event and confirm whether alcohol service is possible.",
    "topic": "events"
  },
  {
    "id": "PPP-053",
    "question": "Can we receive a corporate invoice or custom quote?",
    "answer": "Request a corporate invoice or tailored quote through our events enquiry. Include your company name, preferred date, attendee and player counts, play duration and food requirements. Our team will respond with the next steps.",
    "topic": "events"
  },
  {
    "id": "PPP-054",
    "question": "How can I speak to someone?",
    "answer": "You can call Pixel Pulse Play at (905)-760-2922 or email connect@pixelpulseplay.ca. Please send your enquiry directly to our team through the contact page; this chat does not send it for you.",
    "topic": "team"
  },
  {
    "id": "PPP-055",
    "question": "Can the bot confirm my booking or deposit?",
    "answer": "I cannot independently confirm a booking, deposit or payment. Contact our team to verify your reservation and payment reference. Share booking details directly with them, not banking passwords or full card details in this chat.",
    "topic": "team"
  }
];

const byId = new Map(answers.map((answer) => [answer.id, answer]));
function normalize(value = '') {
  return String(value).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
const byQuestion = new Map();
for (const answer of answers) {
  const key = normalize(answer.question);
  if (!byQuestion.has(key)) byQuestion.set(key, answer);
}

// Specific requests precede the older broad topic rules. Match common paraphrases
// without using personal data, external inference, or ambiguous word overlap.
const rules = [
  ['PPP-SUP-020', /\b(hold|held|pending|tentative)\b.*\b(date|booking|reservation|payment|party|slot|time)\b|\b(date|booking|reservation|payment|party|slot)\b.*\b(hold|held|pending|tentative)\b/],
  ['PPP-SUP-018', /\b(deposit|payment)\b.*\b(sent|paid|received|receipt|verified|verify|confirmed)\b|\b(sent|paid|received|verify)\b.*\b(deposit|payment)\b/],
  ['PPP-055', /\b(bot|you)\b.*\b(confirm|verify|check)\b.*\b(booking|reservation|deposit|payment)\b/],
  ['PPP-SUP-017', /\b(alcohol|beer|wine|liquor|booze)\b/],
  ['PPP-051', /\b(catering|caterer|outside food)\b.*\b(private|corporate|event)\b|\b(private|corporate|event)\b.*\b(catering|caterer|outside food)\b/],
  ['PPP-SUP-011', /\bwaivers?\b.*\b(more|extra|different|higher|discrepancy|discrepancies|parents|too many|doesnt match|does not match)\b|\b(more|extra|different|higher|too many)\b.*\bwaivers?\b/],
  ['PPP-SUP-013', /\b(checklist|preparty|pre party)\b|\b(confirm|prepare|check|ready)\b.*\b(before|party day)\b/],
  ['PPP-SUP-014', /\b(return|back|resume|split)\b.*\b(games?|gameplay|play|playing)\b|\b(games?|gameplay|play|playing)\b.*\b(after eating|after food|after pizza|after cake|around food)\b/],
  ['PPP-SUP-006', /\b(extend|extension|extra|additional|longer|more|another)\b.*\b(gameplay|game time|playtime|play time|playing time|minutes)\b|\b(gameplay|game time|playtime|play time)\b.*\b(extend|extra|longer)\b/],
  ['PPP-SUP-016', /^(?=.*\b(play|players|people|guests|children|teams|everyone)\b).*\b(same room|one room|together in)\b/],
  ['PPP-SUP-005', /\b(extra|additional|more|add)\b.*\b(players?|participants?|children|kids|guests)\b/],
  ['PPP-SUP-007', /\bpizzas?\b.*\b(flavou?rs?|toppings?|choices?|types?|options?)\b|\b(flavou?rs?|toppings?|choices?|cheese|pepperoni)\b.*\bpizzas?\b/],
  ['PPP-SUP-008', /\b(many|extra|additional|more)\b.*\bpizzas?\b|\bpizzas?\b.*\b(included|inclusions|extra|more|additional)\b/],
  ['PPP-SUP-009', /\b(room setup|room set up|tables?|tablecloths?|cutlery|plates|napkins|chairs)\b/],
  ['PPP-SUP-010', /\b(tax|taxes|hst)\b/],
  ['PPP-SUP-002', /\b(supervis|supervision|supervised|childcare|babysitting|look after|watch the children|watch our kids)\w*\b/],
  ['PPP-SUP-004', /\b(younger|under seven|under 7|toddler|toddlers)\b.*\b(attend|pay|paying|charged|free|without playing|not playing)\b/],
  ['PPP-SUP-003', /\b(spectators?|nonplaying|non playing)\b|\b(parents|adults)\b.*\b(count|paid|pay|paying|charged|guest total|without playing|not playing)\b/],
  ['PPP-SUP-001', /\badults?\b.*\b(play|playing|participate|join|allowed|wristband)\b|\b(can|may)\b.*\badults?\b.*\b(challenges?|rooms?)\b/],
  ['PPP-SUP-015', /\b(large|larger|school)\b.*\b(groups?|guests|birthday|event|party|trips?)\b|\bfield trips?\b|\b\d{2,}\b.*\b(guests|people|players|children|participants)\b/],
  ['PPP-039', /\b(deposits?|e transfer|etransfer|interac)\b/],
  ['PPP-SUP-019', /\b(payment methods?|payment options|balance|credit card|debit card|e transfer|cash)\b/],
  ['PPP-053', /\b(invoice|custom quote|tailored quote)\b.*\b(corporate|company|group|event)\b|\b(corporate|company|group|event)\b.*\b(invoice|custom quote|tailored quote)\b/],
  ['PPP-050', /\b(corporate|team building|group event|private event|fundrais\w*)\b/],
  ['PPP-001', /\bwhat is pixel pulse(?: play)?\b|\b(escape room|escape rooms)\b/],
  ['PPP-008', /\b(how long|duration|minutes)\b.*\b(each|individual|single|one)\b.*\b(game|challenge|room)\b|\b(each|individual|single)\b.*\b(game|challenge)\b.*\b(last|long|minutes|duration)\b/],
  ['PPP-011', /\b(ages|age requirements|age limit|age range|suitable ages|under seven|under 7)\b/],
  ['PPP-018', /\b(six|four|five|[4-6])\b.*\b(children|kids|players)\b/],
  ['PPP-021', /\bbirthday child\b.*\b(free|offer|promotion)\b/],
  ['PPP-026', /\b(early|before)\b.*\b(decorat\w*|setup|set up)\b|\b(decorat\w*|setup|set up)\b.*\bearly\b/],
  ['PPP-030', /\b(drinks|juice|water|pop|beverages)\b.*\b(included|include|provided)\b/],
  ['PPP-035', /\b(arcade|tokens?|coins?)\b.*\b(cards?|tokens?|coins?)\b/],
  ['PPP-037', /\b(birthday|party)\b.*\b(date|availability|available|reserve|reservation)\b/],
  ['PPP-038', /\b(reserve|reservation)\b.*\b(date|party|birthday)\b/],
  ['PPP-054', /\b(speak|talk)\b.*\b(someone|person|human|team|staff)\b/],
];

const teamLinks = [
  { label: 'Contact our team', href: '/contactus' },
  { label: 'Call (905)-760-2922', href: 'tel:+19057602922' },
];
const linksByTopic = {
  birthday: [
    { label: 'Request a birthday party', href: 'https://birthdays.pixelpulseplay.ca/#birthday-party-form' },
    { label: 'Explore birthday packages', href: '/kids-birthday-parties' },
    teamLinks[0],
  ],
  events: [{ label: 'Enquire about a group event', href: 'https://events.pixelpulseplay.ca' }, teamLinks[0]],
  existing: [teamLinks[0]],
  play: [{ label: 'How to play', href: '/how-to-play' }, teamLinks[0]],
  visit: [{ label: 'Plan your visit & contact us', href: '/contactus' }],
  team: teamLinks,
};

export function getPixieKnowledgeReply(message, { address = '' } = {}) {
  const text = normalize(message);
  let answer = byQuestion.get(text);
  if (!answer) {
    const match = rules.find(([id, pattern]) => {
      if (id === 'PPP-SUP-017' && /\b(non alcoholic|alcohol free)\b/.test(text)) return false;
      // A private birthday package is not a whole-venue private event.
      if (id === 'PPP-050' && /\bbirthday\b/.test(text) && /\b(private|exclusive)\b/.test(text)) return false;
      return pattern.test(text);
    });
    if (match) answer = byId.get(match[0]);
  }
  if (!answer) return null;

  let links = linksByTopic[answer.topic] || teamLinks;
  if (['PPP-045', 'PPP-SUP-012'].includes(answer.id)) links = [{ label: 'Complete a waiver', href: '/waiver' }, teamLinks[0]];
  if (['PPP-046', 'PPP-SUP-011'].includes(answer.id)) links = [{ label: 'Check party waiver status', href: 'https://pixelpulseplay.ca/party-dashboard' }, teamLinks[0]];
  if (['PPP-039', 'PPP-040', 'PPP-SUP-019'].includes(answer.id)) links = [{ label: 'Email connect@pixelpulseplay.ca', href: 'mailto:connect@pixelpulseplay.ca' }, ...teamLinks];
  if (['PPP-052', 'PPP-SUP-017'].includes(answer.id)) links = [teamLinks[0], ...linksByTopic.events.slice(0, 1)];
  const location = String(address).trim();
  return {
    text: answer.id === 'PPP-002' && location ? `You’ll find Pixel Pulse Play at ${location}. Contact our team if you need directions.` : answer.answer,
    links,
    topic: answer.topic,
  };
}
