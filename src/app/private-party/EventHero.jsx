"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTurnstileSiteKey } from "@/lib/useTurnstileSiteKey";
import TurnstileWidget from "../components/smallComponents/TurnstileWidget";

const slides = [
  {
    title: "Christmas Party",
    headline: "Bring Some Competition To The Celebration.",
    body: "Challenge your crew, climb the leaderboard, and turn your Christmas get-together into something worth remembering.",
    image: "/assets/images/events/christmas-party.webp",
    alt: "Christmas party playing interactive challenges at Pixel Pulse Play",
  },
  {
    title: "Family Gathering",
    headline: "Make Family Time More Fun.",
    body: "Play, compete, laugh and reconnect with easy-to-join challenges made for families to enjoy together.",
    image: "/assets/images/events/family-gathering-2026-v4.webp",
    alt: "Multi-generation family gathering at Pixel Pulse Play",
    preserveOrientation: true,
  },
  {
    title: "Corporate Party",
    headline: "Turn Team Time Into Game Time.",
    body: "Bring your crew together with hosted gameplay, friendly competition, and plenty of moments to laugh, connect, and compete.",
    image: "/assets/images/events/corporate-party.webp",
    alt: "Corporate group playing interactive challenges at Pixel Pulse Play",
  },
  {
    title: "Fundraising Event",
    headline: "Make Your Fundraiser More Than A Donation.",
    body: "Create a fun, engaging experience that gives families and supporters a reason to show up, participate, and stay involved.",
    image: "/assets/images/events/fundraising-event.webp",
    alt: "Community fundraising event at Pixel Pulse Play",
  },
];

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  date: "",
  selectedEvent: slides[0].title,
  groupSize: "",
  privateParty: "",
};

export default function EventHero() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [formData, setFormData] = useState(initialForm);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const { siteKey, turnstileEnabled, turnstileLoading } = useTurnstileSiteKey();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  const showSlide = (index) => {
    const next = (index + slides.length) % slides.length;
    setActive(next);
    setFormData((current) => ({ ...current, selectedEvent: slides[next].title }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (turnstileLoading || (turnstileEnabled && !turnstileToken)) {
      setStatus("Please complete the verification check.");
      return;
    }

    setSubmitting(true);
    setStatus("Sending your inquiry...");
    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          from: "events",
          time: "",
          selectedPackage: "",
          contactCompany: "",
          websiteUrl: "",
          turnstileToken,
          message: [
            `Estimated group size: ${formData.groupSize || "Not provided"}`,
            `Looking for a private party: ${formData.privateParty || "Not provided"}`,
          ].join("\n"),
          subject: `${formData.fullName} - ${formData.selectedEvent} inquiry`,
        }),
      });
      if (!response.ok) throw new Error("Inquiry failed");
      window.sessionStorage.setItem("pppContactEmail", formData.email);
      router.push("/contactus/thank-you");
    } catch {
      setStatus("We could not send your inquiry. Please try again or call us.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="ppp-private-hero">
      <div className="ppp-private-hero__slides" aria-live="polite">
        {slides.map((slide, index) => (
          <Image
            key={slide.image}
            className={`ppp-private-hero__image${index === active ? " is-active" : ""}${slide.preserveOrientation ? " is-original-orientation" : ""}`}
            src={slide.image}
            alt={index === active ? slide.alt : ""}
            fill
            priority={index === 0}
            sizes="100vw"
          />
        ))}
      </div>

      <div className="ppp-private-shell ppp-private-hero__layout">
        <div className="ppp-private-hero__copy">
          <p className="ppp-private-kicker">{slides[active].title} | Vaughan</p>
          <h1>{slides[active].headline}</h1>
          <p className="ppp-private-hero__text">{slides[active].body}</p>
          <div className="ppp-private-hero__controls" aria-label="Event carousel controls">
            <button type="button" onClick={() => showSlide(active - 1)} aria-label="Previous event">&#8592;</button>
            <div>
              {slides.map((slide, index) => (
                <button
                  key={slide.title}
                  type="button"
                  className={index === active ? "is-active" : ""}
                  onClick={() => showSlide(index)}
                  aria-label={`Show ${slide.title}`}
                  aria-current={index === active ? "true" : undefined}
                />
              ))}
            </div>
            <button type="button" onClick={() => showSlide(active + 1)} aria-label="Next event">&#8594;</button>
          </div>
        </div>

        <form className="ppp-event-form" onSubmit={handleSubmit} aria-busy={submitting}>
          <div className="ppp-event-form__heading">
            <p>Plan Your Event</p>
            <h2>Tell Us What You&apos;re Planning</h2>
          </div>
          <label>
            Event type
            <select
              value={formData.selectedEvent}
              onChange={(event) => setFormData({ ...formData, selectedEvent: event.target.value })}
              required
            >
              {slides.map((slide) => <option key={slide.title}>{slide.title}</option>)}
            </select>
          </label>
          <div className="ppp-event-form__row">
            <label>
              Name
              <input type="text" autoComplete="name" value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} required />
            </label>
            <label>
              Phone
              <input type="tel" autoComplete="tel" value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} required />
            </label>
          </div>
          <label>
            Email
            <input type="email" autoComplete="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required />
          </label>
          <div className="ppp-event-form__row">
            <label>
              Preferred date
              <input type="date" value={formData.date} onChange={(event) => setFormData({ ...formData, date: event.target.value })} />
            </label>
            <label>
              Group size
              <input type="number" min="4" max="150" inputMode="numeric" placeholder="Approx." value={formData.groupSize} onChange={(event) => setFormData({ ...formData, groupSize: event.target.value })} />
            </label>
          </div>
          <fieldset className="ppp-event-form__choice">
            <legend>Looking for a private party?</legend>
            <div>
              {["Yes", "No"].map((option) => (
                <label key={option} className={formData.privateParty === option ? "is-selected" : ""}>
                  <input
                    type="radio"
                    name="privateParty"
                    value={option}
                    checked={formData.privateParty === option}
                    onChange={(event) => setFormData({ ...formData, privateParty: event.target.value })}
                    required
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
          {turnstileEnabled ? (
            <TurnstileWidget siteKey={siteKey} onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} onError={() => setStatus("Verification could not load. Please refresh and try again.")} />
          ) : null}
          <button className="ppp-event-form__submit" type="submit" disabled={submitting || turnstileLoading}>
            {submitting ? "Sending..." : "Request Event Details"}
          </button>
          <p className="ppp-event-form__status" aria-live="polite">{status}</p>
        </form>
      </div>
    </section>
  );
}
