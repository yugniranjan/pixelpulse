import test from 'node:test';
import assert from 'node:assert/strict';
import { getPixiePlayReply } from '../src/app/lib/pixiePlay.mjs';

const supplementalCases = [
  ['Can adults participate in the challenge rooms?', /adults.*join.*wristband/i, '/how-to-play'],
  ['Are children supervised during the birthday party?', /parents and guardians.*responsible/i, '/contactus'],
  ['Do parents and other spectators count as paid participants?', /spectator charges.*occupancy/i, '/contactus'],
  ['Can younger children attend without playing?', /confirm.*admission charges/i, '/contactus'],
  ['Can I add extra participants to my party?', /capacity.*additional charges/i, 'https://birthdays.pixelpulseplay.ca/#birthday-party-form'],
  ['Can we extend the gameplay time?', /schedule.*confirm availability/i, 'https://birthdays.pixelpulseplay.ca/#birthday-party-form'],
  ['What pizza choices are available?', /confirm.*cheese or pepperoni/i, '/contactus'],
  ['How many pizzas are included, and can we add more?', /vary by package.*extra charge/i, '/contactus'],
  ['What is included in the party room setup?', /confirm.*tables.*cutlery/i, '/contactus'],
  ['Are package prices and add-ons subject to tax?', /HST.*final total/i, '/contactus'],
  ['Why does the waiver dashboard show more people than I invited?', /waiver.*paid players/i, 'https://pixelpulseplay.ca/party-dashboard'],
  ['How do we complete the waivers?', /party-specific waiver link.*before arrival/i, '/waiver'],
  ['What should we confirm before party day?', /participant count.*waiver completion/i, '/contactus'],
  ['Can the children return to gameplay after pizza and cake?', /booked gameplay allowance.*not automatic/i, '/contactus'],
  ['Can you host a large birthday, school, or corporate group?', /capacity.*must be confirmed/i, 'https://events.pixelpulseplay.ca'],
  ['Can 20 or more guests all play in the same room?', /small teams.*rotate/i, '/how-to-play'],
  ['Can alcohol be served at our private event?', /not automatically.*management team/i, '/contactus'],
  ['I sent my deposit. Is my party confirmed?', /cannot verify.*directly to them/i, '/contactus'],
  ['What payment methods are accepted for the remaining balance?', /E-transfers.*connect@pixelpulseplay.ca.*confirm the amount due/i, '/contactus'],
  ['Can you confirm my date is held while my payment is pending?', /cannot place a hold.*not guaranteed/i, '/contactus'],
];

for (const [question, expected, destination] of supplementalCases) {
  test(`supplemental knowledge: ${question}`, () => {
    const answer = getPixiePlayReply(question);
    assert.match(answer.text, expected);
    assert.ok(answer.links.some((link) => link.href === destination));
    assert.doesNotMatch(answer.text, /\$\d|Historical|Internal_Note|Verify before launch|Approved draft|Escalate to staff/i);
  });
}

test('common paraphrases reach specific policies instead of broad birthday or gameplay replies', () => {
  const variants = [
    ['Will your staff look after our kids?', /parents and guardians.*responsible/i],
    ['Can grown adults join the games?', /wristband.*participating player/i],
    ['Do non-playing parents have to pay?', /confirm spectator charges/i],
    ['Can an under-seven child attend for free?', /confirm.*admission charges/i],
    ['Could I bring additional children?', /capacity.*additional charges/i],
    ['We want more play time', /schedule.*confirm availability/i],
    ['Which toppings can we have on the pizza?', /confirm.*pizza choices/i],
    ['Are tablecloths and plates provided?', /confirm.*cutlery/i],
    ['Does that include HST?', /final total/i],
    ['The waiver count is higher than our player count', /paid players/i],
    ['Can we play after eating?', /booked gameplay allowance/i],
    ['Could 30 or more guests play in one room?', /small teams/i],
    ['Do you offer school trips?', /capacity.*confirmed/i],
    ['May we serve wine?', /management team/i],
    ['Has our deposit been received?', /cannot verify/i],
    ['Can the bot verify my reservation?', /cannot independently confirm/i],
    ['Can our booking be held pending payment?', /cannot place a hold/i],
    ['Can I cancel my party date?', /booking changes.*refunds/i],
  ];
  for (const [question, expected] of variants) assert.match(getPixiePlayReply(question).text, expected, question);
});

test('corporate offers and private catering keep the events destination', () => {
  for (const question of [
    'Do you offer corporate team building?',
    'Could you offer our company a team building day?',
    'Can we bring outside catering for a private event?',
    'Can we arrange a private event with our own caterer?',
    'We need a corporate invoice and a custom quote',
  ]) {
    const answer = getPixiePlayReply(question);
    assert.equal(answer.topic, 'events', question);
    assert.ok(answer.links.some((link) => link.href === 'https://events.pixelpulseplay.ca'), question);
    assert.doesNotMatch(answer.text, /outside cake|Buy 2 Get 2|promotion/i);
  }
  assert.doesNotMatch(getPixiePlayReply('Are non-alcoholic drinks included?').text, /alcohol service.*permitted/i);
});

test('earlier knowledge fills introduction, gameplay and preparation gaps', () => {
  for (const [question, expected] of [
    ['What is Pixel Pulse Play?', /interactive challenge-room.*not a traditional escape room/i],
    ['How long is each game?', /few minutes.*varies/i],
    ['What ages are suitable?', /seven and older/i],
    ['Do arcade games use tokens or coins?', /prepaid-value cards/i],
    ['Can I arrive early to decorate?', /subject to.*readiness/i],
    ['How much does an arcade card cost?', /current card options/i],
    ['Does the birthday child play free?', /published terms.*eligibility/i],
  ]) assert.match(getPixiePlayReply(question).text, expected, question);
  const location = getPixiePlayReply('Where are you located?', { address: 'Current configured address' });
  assert.match(location.text, /Current configured address/);
  assert.doesNotMatch(location.text, /960 Edgeley/);
});

test('owner-confirmed deposits and transfer email override the older draft policy', () => {
  for (const question of [
    'Is a deposit required and how much?',
    'How much is the deposit for Pixel Punch?',
    'Deposit for Pixel Ultra?',
    'What deposit do Pixel Jumbo and Pulse Max require?',
    'Where should I send my e-transfer?',
    'Deposit & payment',
  ]) {
    const answer = getPixiePlayReply(question);
    assert.match(answer.text, /\$100 for Pixel Punch and \$200 for all other birthday packages/);
    assert.match(answer.text, /E-transfers can be sent to connect@pixelpulseplay.ca/);
    assert.ok(answer.links.some((link) => link.href === 'mailto:connect@pixelpulseplay.ca'));
  }
  for (const question of ['I sent my deposit. Is my party confirmed?', 'Can you verify my payment?', 'Has my deposit been received?']) {
    const answer = getPixiePlayReply(question);
    assert.match(answer.text, /cannot (verify|independently confirm)/i);
    assert.ok(answer.links.some((link) => link.href === '/contactus'));
  }
});
