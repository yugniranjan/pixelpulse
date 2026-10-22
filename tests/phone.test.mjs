import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPhoneNumber, matchesPhoneSearch, phoneSearchDigits, phoneLookupVariants, phoneTextVariants } from '../src/app/lib/phone.mjs';

test('Canadian and US contact values share the requested display format', () => {
  for (const value of ['6137991972', '613-799-1972', '(613) 799 1972', '+1 (613) 799-1972', '16137991972', '(613)-799-1972']) {
    assert.equal(formatPhoneNumber(value), '(613)-799-1972');
  }
  assert.equal(formatPhoneNumber(9057602922), '(905)-760-2922');
  assert.equal(formatPhoneNumber('6137991972 ext 42'), '(613)-799-1972 ext. 42');
});

test('formatting preserves international, partial and unexpected values without dropping digits', () => {
  for (const value of ['+44 20 7946 0958', '61379', '613799197200', 'not provided', '+33 6 12 34 56 78']) {
    assert.equal(formatPhoneNumber(value), value);
  }
  assert.equal(formatPhoneNumber(null), '');
  assert.equal(formatPhoneNumber(''), '');
});

test('copied formatted phones and partial phone searches match existing raw values', () => {
  assert.equal(matchesPhoneSearch('6137991972', '(613)-799-1972'), true);
  assert.equal(matchesPhoneSearch('(613)-799-1972', '7991'), true);
  assert.equal(matchesPhoneSearch('6137991972', '+1 (613) 799-1972'), true);
  assert.equal(matchesPhoneSearch('6137991972', 'Jane 613'), false);
  assert.equal(matchesPhoneSearch('6137991972', '4165550123'), false);
  assert.equal(phoneSearchDigits('person@example.com'), '');
});

test('lookup variants find existing values with or without a North American country code', () => {
  for (const value of ['(613)-799-1972', '+1 (613) 799-1972', '6137991972']) {
    assert.deepEqual(phoneLookupVariants(value), ['6137991972', '16137991972']);
    const variants = phoneTextVariants(value);
    assert.ok(variants.includes('6137991972'));
    assert.ok(variants.includes('+1 (613) 799-1972'));
    assert.ok(variants.includes('(613)-799-1972'));
    assert.ok(variants.length <= 10);
  }
  assert.deepEqual(phoneLookupVariants('+44 20 7946 0958'), ['442079460958']);
  assert.deepEqual(phoneLookupVariants(''), []);
});
