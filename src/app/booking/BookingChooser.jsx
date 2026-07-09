"use client";

import { useMemo, useState } from "react";

const BOOKING_ICONS = {
  party: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 21h16v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8Z" />
      <path d="M4 15h16" />
      <path d="M9 11V7M12 11V7M15 11V7" />
      <path d="M12 2s-1.5 1.4-1.5 2.6A1.5 1.5 0 0 0 12 6a1.5 1.5 0 0 0 1.5-1.4C13.5 3.4 12 2 12 2Z" />
    </svg>
  ),
  vr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="2" y="7" width="20" height="11" rx="4" />
      <circle cx="8" cy="12.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12.5" r="1.6" fill="currentColor" stroke="none" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  ticket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M6 4h9l3 4-9 12L6 8Z" />
      <path d="M6 8h12M12 4v4" />
    </svg>
  ),
  coupon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z" />
      <path d="M10 5v14" strokeDasharray="2 2" />
    </svg>
  ),
};

function shouldOpenOutsideFrame(option = {}) {
  return ["party", "birthday"].includes(option.type);
}

export default function BookingChooser({ options = [], selectedType = "" }) {
  const initialFrameOption = useMemo(
    () => options.find((option) => !shouldOpenOutsideFrame(option)),
    [options],
  );
  const [frameOption, setFrameOption] = useState(initialFrameOption);

  return (
    <>
      <div className="ppp-booking-options">
        {options.length ? options.map((option) => {
          const opensOutside = shouldOpenOutsideFrame(option);
          const isSelected = option.type === selectedType || option.type === frameOption?.type;

          return (
            <article
              className={[
                "ppp-booking-option",
                option.variant ? `ppp-booking-option--${option.variant}` : "",
                isSelected ? "is-selected" : "",
              ].filter(Boolean).join(" ")}
              key={option.type}
            >
              <div className="ppp-booking-option__body">
                <div className="ppp-booking-option__icon">
                  {BOOKING_ICONS[option.iconKey] || BOOKING_ICONS.ticket}
                </div>
                {option.eyebrow ? (
                  <span className="ppp-booking-option__eyebrow">{option.eyebrow}</span>
                ) : null}
                <h3>{option.title}</h3>
              </div>
              <div className="ppp-booking-option__perf" aria-hidden="true" />
              <div className="ppp-booking-option__footer">
                {option.meta ? <span>{option.meta}</span> : null}
                <a
                  href={option.href}
                  target={opensOutside ? "_blank" : "ppp-booking-frame"}
                  rel={opensOutside ? "noopener noreferrer" : undefined}
                  onClick={() => {
                    if (!opensOutside) {
                      setFrameOption(option);
                    }
                  }}
                >
                  {option.cta}
                </a>
              </div>
            </article>
          );
        }) : (
          <p className="ppp-booking-empty">No booking options are active right now.</p>
        )}
      </div>

      {frameOption ? (
        <section className="ppp-booking-frame-shell" aria-label="Booking checkout">
          <div className="ppp-booking-frame-toolbar">
            <div>
              <span>Booking window</span>
              <strong>{frameOption.title}</strong>
            </div>
            <a href={frameOption.href} target="_blank" rel="noopener noreferrer">
              Open full page
            </a>
          </div>
          <iframe
            className="ppp-booking-frame"
            name="ppp-booking-frame"
            src={frameOption.href}
            title={`${frameOption.title} checkout`}
          />
        </section>
      ) : null}
    </>
  );
}
