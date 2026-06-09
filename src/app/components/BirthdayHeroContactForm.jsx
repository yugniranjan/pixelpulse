"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INITIAL_FORM = {
  fullName: "",
  childName: "",
  childYear: "",
  email: "",
  phone: "",
  date: "",
  time: "",
  selectedPackage: "",
  message: "",
};

export default function BirthdayHeroContactForm({ urgency = "", packageOptions = [] }) {
  const router = useRouter();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const isPrivatePartySelected = formData.selectedPackage
    .toLowerCase()
    .includes("private party");

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("Sending your party request...");

    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          from: "birthday-party-landing",
          selectedEvent: "BirthDay Party",
          selectedPackage: formData.selectedPackage,
          subject: `${formData.fullName} - Birthday Party Inquiry`,
          time: formData.time,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to send birthday party inquiry.");
      }

      setFormData(INITIAL_FORM);
      setStatus("Thanks. We received your birthday party request.");
      window.sessionStorage.setItem("pppContactEmail", formData.email);
      router.push("/contactus/thank-you");
    } catch (error) {
      setStatus("We could not send this request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="ppp-birthday-hero-form"
      id="birthday-party-form"
      onSubmit={handleSubmit}
      aria-busy={submitting}
    >
      <div className="ppp-birthday-hero-form__head">
        <p>Plan the party</p>
        <h2>Get a birthday callback</h2>
      </div>

      <div className="ppp-birthday-hero-form__fields">
        <label>
          <span>Name</span>
          <input
            name="fullName"
            value={formData.fullName}
            onChange={updateField}
            autoComplete="name"
            required
          />
        </label>

        <label>
          <span>Child&apos;s name</span>
          <input
            name="childName"
            value={formData.childName}
            onChange={updateField}
            required
          />
        </label>

        <label>
          <span>Child&apos;s Age</span>
          <input
            type="number"
            name="childYear"
            value={formData.childYear}
            onChange={updateField}
            min="1"
            max="18"
            inputMode="numeric"
            required
          />
        </label>

        <label>
          <span>Email</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={updateField}
            autoComplete="email"
            inputMode="email"
            required
          />
        </label>

        <label>
          <span>Phone</span>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={updateField}
            autoComplete="tel"
            inputMode="tel"
            required
          />
        </label>

        <label>
          <span>Preferred date</span>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={updateField}
          />
        </label>

        <label>
          <span>Preferred time</span>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={updateField}
          />
        </label>

        {packageOptions.length > 0 ? (
          <label>
            <span>Party package</span>
            <select
              name="selectedPackage"
              value={formData.selectedPackage}
              onChange={updateField}
            >
              <option value="">Select a package</option>
              {packageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <p className="ppp-birthday-hero-form__note ppp-birthday-hero-form__wide">
          {isPrivatePartySelected ? (
            "Enjoy exclusive access to all challenge rooms, non-stop fun for your group."
          ) : (
            <>
              Each additional participant beyond your package is charged{" "}
              <strong>$14.99</strong>, paid at the venue.
            </>
          )}
        </p>

        <label className="ppp-birthday-hero-form__wide">
          <span>Party notes</span>
          <textarea
            name="message"
            value={formData.message}
            onChange={updateField}
            placeholder="Kids, date, package, or questions"
            required
          />
        </label>
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? "Sending..." : "Send Birthday Request"}
      </button>

      <p aria-live="polite">
        {status || "We will follow up with birthday package availability."}
      </p>

      {urgency ? <p className="ppp-birthday-urgency">{urgency}</p> : null}
    </form>
  );
}
