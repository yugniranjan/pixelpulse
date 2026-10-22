"use client";

import { forwardRef, useEffect, useRef, useState } from 'react';
import { formatPhoneNumber } from '@/lib/phone.mjs';

const PhoneInput = forwardRef(function PhoneInput({ value = '', onChange, onBlur, ...props }, ref) {
  const [draft, setDraft] = useState(() => formatPhoneNumber(value));
  const lastValue = useRef(value);

  useEffect(() => {
    if (value !== lastValue.current) {
      lastValue.current = value;
      setDraft(formatPhoneNumber(value));
    }
  }, [value]);

  return <input ref={ref} type="tel" inputMode="tel" autoComplete="tel" placeholder="(###)-###-####" {...props} value={draft}
    onChange={(event) => {
      lastValue.current = event.target.value;
      setDraft(event.target.value);
      onChange?.(event);
    }}
    onBlur={(event) => {
      setDraft(formatPhoneNumber(event.target.value));
      onBlur?.(event);
    }} />;
});

export default PhoneInput;
