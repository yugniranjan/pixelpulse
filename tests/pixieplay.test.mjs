import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPixiePlayKnowledge, getPixiePartyPlan, getPixiePlayReply, PIXIE_PROMPTS, PIXIE_QUESTIONS } from '../src/app/lib/pixiePlay.mjs';

test('suggested topics give useful answers and working site destinations', () => {
  for (const prompt of PIXIE_PROMPTS) {
    const answer = getPixiePlayReply(prompt);
    assert.ok(answer.text.length > 30);
    assert.ok(answer.links.length > 0);
  }
  assert.ok(getPixiePlayReply('How do I buy tickets?').links.some((link) => link.href === '/booking?type=ticket'));
  assert.ok(getPixiePlayReply('Tell me about packages').links.some((link) => link.href.includes('birthdays.pixelpulseplay.ca')));
  assert.ok(getPixiePlayReply('Do we need waivers?').links.some((link) => link.href === '/waiver'));
});

test('birthday pricing follow-up stays on birthday booking and does not invent prices or availability', () => {
  const initial = getPixiePlayReply('Plan a birthday');
  const followUp = getPixiePlayReply('How much does it cost?', {}, initial.topic);
  assert.equal(followUp.topic, 'birthday');
  assert.ok(followUp.links.some((link) => link.href === '/kids-birthday-parties'));
  assert.doesNotMatch(followUp.text, /\$\d|guaranteed|available today/i);
  const hours = getPixiePlayReply('What are your hours tomorrow?');
  assert.match(hours.text, /check with our team/i);
  assert.doesNotMatch(hours.text, /\d\s*(am|pm)/i);
});

test('unknown questions and sensitive visit needs go to a real team member', () => {
  for (const message of ['I need a refund', 'My child has a peanut allergy', 'Can I play while pregnant?', 'Does my insurance cover injuries?', 'Please guarantee my booking']) {
    const answer = getPixiePlayReply(message);
    assert.equal(answer.topic, 'team');
    assert.ok(answer.links.some((link) => link.href === '/contactus'));
  }
});

test('private birthday distinction does not promise exclusive facility use', () => {
  const answer = getPixiePlayReply('Is a birthday package private?');
  assert.match(answer.text, /don’t reserve the whole facility/);
  assert.ok(answer.links.some((link) => link.href === 'https://events.pixelpulseplay.ca'));
});

test('site FAQ text and current address can be used without rendering source HTML', () => {
  const knowledge = buildPixiePlayKnowledge([
    { question: 'Are socks required?', answer: '<p>Please wear <strong>closed-toe shoes</strong>.</p>' },
    { question: 'Empty answer', answer: '' },
    { question: 'Not text', answer: { secret: 'do not include' } },
  ], '123 <b>Main Street</b>, Vaughan');
  assert.equal(knowledge.faqs.length, 1);
  const answer = getPixiePlayReply('Are socks required to enter?', knowledge);
  assert.equal(answer.text, 'Please wear closed-toe shoes.');
  assert.doesNotMatch(answer.text, /<|>/);
  assert.match(getPixiePlayReply('Where are you?', knowledge).text, /123 Main Street, Vaughan/);
});

test('bot identifies itself as automated and does not pretend to be a live person', () => {
  assert.match(getPixiePlayReply('Are you a real person?').text, /automated/);
  assert.match(getPixiePlayReply('What is your email?').text, /connect@pixelpulseplay.ca/);
});

test('empty and oversized input are handled without an external service', () => {
  assert.equal(getPixiePlayReply('').links.length, 0);
  assert.equal(getPixiePlayReply('a'.repeat(601)).links.length, 0);
});

test('checking signed waivers routes to the party dashboard while signing keeps the waiver form', () => {
  const dashboard = 'https://pixelpulseplay.ca/party-dashboard';
  for (const question of ['Check waiver status', 'Who has signed the waiver?', 'How many waivers are completed?', 'View missing waivers', 'Open the party dashboard']) {
    const answer = getPixiePlayReply(question);
    assert.equal(answer.topic, 'waiver');
    assert.equal(answer.links[0].href, dashboard);
    assert.match(answer.text, /party ID/);
    assert.ok(!answer.links.some((link) => link.href === '/waiver'));
  }
  for (const question of ['Complete a waiver', 'Who needs to sign a waiver?', 'How do I fill out a waiver?']) {
    assert.equal(getPixiePlayReply(question).links[0].href, '/waiver');
  }
  assert.ok(getPixiePlayReply('I already have a booking').links.some((link) => link.href === dashboard));
  assert.ok(PIXIE_QUESTIONS.existing.includes('Check waiver status'));
});

test('shared-reference questions cover existing parties, gameplay and unconfirmed policy details', () => {
  assert.equal(getPixiePlayReply('I already have a booking').topic, 'existing');
  assert.equal(getPixiePlayReply('Corporate or group event').links[0].href, 'https://events.pixelpulseplay.ca');
  assert.match(getPixiePlayReply('How do children play?').text, /up to five players/);
  assert.match(getPixiePlayReply('Party duration').text, /separate parts/);
  assert.match(getPixiePlayReply('Arcade games').text, /available separately/);
  assert.match(getPixiePlayReply('Birthday invitations').text, /party coordinator/);
  assert.match(getPixiePlayReply('Arrival time').text, /15 minutes/);
  for (const question of ['Small birthday groups', 'Birthday promotions']) {
    const answer = getPixiePlayReply(question);
    assert.doesNotMatch(answer.text, /\$\d|guaranteed|confirmed booking/i);
    assert.ok(answer.links.some((link) => link.href === '/contactus'));
  }
  for (const questions of Object.values(PIXIE_QUESTIONS)) {
    for (const question of questions) assert.ok(getPixiePlayReply(question).links.length > 0, question);
  }
});

test('birthday plan carries preferences to the enquiry without quoting prices or reserving a slot', () => {
  const plan = getPixiePartyPlan({ guests: '8–12', age: '7–10', date: '2026-11-15', privacy: 'Standard birthday package' });
  assert.equal(plan.topic, 'birthday');
  const url = new URL(plan.links[0].href);
  assert.equal(url.origin, 'https://birthdays.pixelpulseplay.ca');
  assert.equal(url.hash, '#birthday-party-form');
  assert.equal(url.searchParams.get('partyDate'), '2026-11-15');
  assert.match(url.searchParams.get('partyDetails'), /8–12 children · Ages 7–10/);
  assert.match(plan.text, /confirmed by our team/);
  assert.doesNotMatch(plan.text, /\$\d|reservation confirmed/i);
});

test('private and younger/small-group plans route to the appropriate human confirmation', () => {
  const base = { guests: '4–7', age: 'Under 7', date: '2026-11-15', privacy: 'Help me choose' };
  assert.match(getPixiePartyPlan(base).text, /confirm the right option/);
  const privatePlan = getPixiePartyPlan({ ...base, privacy: 'Private venue booking' });
  assert.equal(privatePlan.links[0].href, 'https://events.pixelpulseplay.ca');
  assert.match(privatePlan.text, /exclusive venue access/);
  for (const invalid of [{ guests: 'bad' }, { age: 'unknown' }, { date: '2026-02-30' }, { date: '2026-2-3' }, { privacy: 'anything' }]) {
    assert.equal(getPixiePartyPlan({ ...base, ...invalid }), null);
  }
});

test('visitors can explore a party plan before choosing a date', () => {
  const plan = getPixiePartyPlan({ guests: '8–12', age: '7–10', date: '', privacy: 'Standard birthday package' });
  assert.match(plan.text, /Date to be decided/);
  const url = new URL(plan.links[0].href);
  assert.equal(url.searchParams.has('partyDate'), false);
  assert.match(url.searchParams.get('partyDetails'), /Date to be decided/);
  assert.match(plan.text, /confirmed by our team/);
});
