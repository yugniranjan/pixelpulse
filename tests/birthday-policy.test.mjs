import test from 'node:test';
import assert from 'node:assert/strict';
import { BIRTHDAY_DEPOSIT_AMOUNT, BIRTHDAY_DEPOSIT_NOTICE, normalizeBirthdayDepositText } from '../src/app/lib/birthdayPolicy.mjs';

test('all birthday packages share the current deposit policy', () => {
  assert.equal(BIRTHDAY_DEPOSIT_AMOUNT, 200);
  assert.match(BIRTHDAY_DEPOSIT_NOTICE, /\$200 deposit.*all birthday packages/);
});

test('legacy deposit copy is updated without changing package prices or other charges', () => {
  for (const original of [
    'Pixel Punch $399. Non-refundable deposit of $100 is required for booking.',
    'Pixel Ultra $499. Non-refundable deposit of $100 is required for booking.',
    'Package $499. A $100 deposit is required. Additional player $25 plus HST.',
    'Package $499. Non-refundable deposit is required for booking.',
    '<p>Package $499. Deposit: $100.00.</p>',
  ]) {
    const updated = normalizeBirthdayDepositText(original);
    assert.match(updated, /\$200/);
    assert.doesNotMatch(updated, /\$100/);
    if (original.includes('$499')) assert.match(updated, /\$499/);
    if (original.includes('$399')) assert.match(updated, /\$399/);
    if (original.includes('$25')) assert.match(updated, /\$25 plus HST/);
  }
  assert.equal(normalizeBirthdayDepositText('Package $499; extra player $25.'), 'Package $499; extra player $25.');
  assert.equal(normalizeBirthdayDepositText(null), null);
});

test('birthday enquiry auto-replies quote the same deposit for all four packages', async () => {
  const { readFile } = await import('node:fs/promises');
  const { createContext, SourceTextModule, SyntheticModule } = await import('node:vm');
  const policy = await import('../src/app/lib/birthdayPolicy.mjs');
  const phone = await import('../src/app/lib/phone.mjs');
  const sent = [];
  const context = createContext({ console, URL, Date, Buffer, process: { env: { GMAIL_USER: 'preview@example.com', GMAIL_APP_PASSWORD: 'test-only' } } });
  const route = new SourceTextModule(await readFile(new URL('../src/app/api/email/route.js', import.meta.url), 'utf8'), { context });
  const dependencies = {
    'next/server': { NextResponse: Response },
    'nodemailer': { default: { createTransport: () => ({ sendMail: async (email) => { sent.push(email); return { messageId: 'preview' }; } }) } },
    '@/lib/phone.mjs': phone,
    '@/lib/birthdayPolicy.mjs': policy,
  };
  await route.link((specifier) => {
    const values = dependencies[specifier];
    assert.ok(values, specifier);
    return new SyntheticModule(Object.keys(values), function () { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context });
  });
  await route.evaluate();
  for (const [index, selectedPackage] of ['Pixel Punch', 'Pixel Ultra', 'Pixel Jumbo', 'Pulse Max'].entries()) {
    const email = `preview${index}@example.com`;
    const response = await route.namespace.POST(new Request('https://pixelpulseplay.ca/api/email', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://pixelpulseplay.ca' },
      body: JSON.stringify({ from: 'Birthday party', selectedEvent: 'Birthday', selectedPackage, fullName: 'Demo Parent', phone: '6137991972', email, message: 'Party enquiry' }),
    }));
    assert.equal(response.status, 200, selectedPackage);
    const reply = sent.find((item) => item.to === email);
    assert.ok(reply, selectedPackage);
    for (const body of [reply.text, reply.html]) {
      assert.match(body, /\$200 deposit.*all birthday packages/);
      assert.match(body, /E-transfers can be sent to connect@pixelpulseplay.ca/);
      assert.doesNotMatch(body, /\$100/);
    }
  }
});
