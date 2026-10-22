import test from 'node:test';
import assert from 'node:assert/strict';
import { getPixieFlowReply } from '../src/app/lib/pixiePlayFlow.mjs';

test('informational food answers have one relevant action and no booking suggestions', () => {
  for (const question of ['Can I bring food from home?', 'What pizza choices are available?', 'Are drinks included?']) {
    const reply = getPixieFlowReply(question);
    assert.equal(reply.links.length, 1);
    assert.equal(reply.links[0].href, '/contactus');
    assert.doesNotMatch(reply.links[0].label, /book|package/i);
    assert.ok(reply.questions.length <= 2);
    assert.doesNotMatch(reply.questions.join(' '), /book|plan a birthday/i);
    assert.equal(reply.startPlanning, false);
  }
});

test('visitors compare packages before requesting a booking, and explicitly start planning', () => {
  assert.equal(getPixieFlowReply('What birthday packages are available?').links[0].href, '/kids-birthday-parties');
  assert.match(getPixieFlowReply('I want to book a birthday party').links[0].href, /birthdays.pixelpulseplay.ca/);
  const plan = getPixieFlowReply('Help me plan a birthday');
  assert.equal(plan.startPlanning, true);
  assert.equal(plan.links.length, 0);
  assert.match(plan.text, /number of children/);
  for (const question of ['What is included in a birthday party?', 'I do not want to plan a birthday', "I don't want to plan a birthday"]) {
    assert.equal(getPixieFlowReply(question).startPlanning, false, question);
  }
});

test('waiver, payment and event workflows keep the correct single destination', () => {
  const cases = [
    ['Who has signed the waiver?', 'https://pixelpulseplay.ca/party-dashboard'],
    ['How do we complete the waivers?', '/waiver'],
    ['How much deposit for Pixel Punch?', 'mailto:connect@pixelpulseplay.ca'],
    ['Do you offer corporate team building?', 'https://events.pixelpulseplay.ca'],
    ['Can we bring outside catering for a private event?', 'https://events.pixelpulseplay.ca'],
    ['I sent my deposit. Is my party confirmed?', '/contactus'],
  ];
  for (const [question, destination] of cases) {
    const reply = getPixieFlowReply(question);
    assert.deepEqual(reply.links.map((link) => link.href), [destination], question);
  }
  assert.match(getPixieFlowReply('Deposit for Pixel Punch?').text, /\$200 for all birthday packages/);
  assert.equal(getPixieFlowReply('Hi').links.length, 0);
  assert.equal(getPixieFlowReply('Hi').questions.length, 0);
  assert.equal(getPixieFlowReply('Do you sell unicorns?').questions.length, 0);
});
