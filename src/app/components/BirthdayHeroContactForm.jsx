"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTurnstileSiteKey } from "@/lib/useTurnstileSiteKey";
import TurnstileWidget from "./smallComponents/TurnstileWidget";

const CONTACT_FORM_URL = "https://pixelpulseplay.ca/contactus";
const ONLINE_PACKAGE_DETAIL_KEYS = [
  "Number of Participants",
  "Game Time Included",
  "Total Party Duration",
  "Party Room Access",
  "Refreshments",
];
const PARTY_ROOM_ACCESS_BY_PACKAGE = {
  "pixel punch": "45 minutes",
  "pixel ultra": "45 minutes",
  "pixel jumbo": "2.5 hours",
  "pulse max": "3 hours",
};

const INITIAL_FORM = {
  fullName: "",
  childName: "",
  childYear: "",
  email: "",
  phone: "",
  date: "",
  time: "",
  selectedPackage: "",
  extraPlayTime: "",
  message: "",
};

const PARTY_SLOT_STARTS = [
  { label: "10:30 AM", minutes: 10 * 60 + 30 },
  { label: "1:00 PM", minutes: 13 * 60 },
  { label: "3:30 PM", minutes: 15 * 60 + 30 },
  { label: "6:00 PM", minutes: 18 * 60 },
];

const DEFAULT_PACKAGE_DURATIONS = {
  "pixel punch": 105,
  "pixel ultra": 120,
  "pixel jumbo": 150,
  "pulse max": 180,
};

function normalizePackageOption(option) {
  if (typeof option === "string") {
    return { name: option };
  }

  return option || {};
}

function parseDurationMinutes(value = "") {
  const text = String(value).toLowerCase();
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*hour/);
  const minuteMatch = text.match(/(\d+)\s*minute/);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;

  return Math.round(hours * 60 + minutes);
}

function formatMinutes(totalMinutes) {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function getPackageDuration(option) {
  const packageOption = normalizePackageOption(option);
  const packageName = packageOption.name || "";
  const configuredDuration = parseDurationMinutes(packageOption["Total Party Duration"]);

  return configuredDuration || DEFAULT_PACKAGE_DURATIONS[packageName.toLowerCase()] || 120;
}

function getTimeSlotsForPackage(option) {
  const duration = getPackageDuration(option);

  return PARTY_SLOT_STARTS.map((slot) => `${slot.label} - ${formatMinutes(slot.minutes + duration)}`);
}

function PackageDetails({ packageDetails }) {
  if (!packageDetails) return null;

  return (
    <>
      <div className="ppp-birthday-hero-form__online-head">
        <div>
          <small>Selected package</small>
          <h3>{packageDetails.name}</h3>
        </div>
        {packageDetails["Package Price"] ? (
          <strong>{packageDetails["Package Price"]}</strong>
        ) : null}
      </div>

      <dl className="ppp-birthday-hero-form__package-details">
        {ONLINE_PACKAGE_DETAIL_KEYS.map((key) => {
          const value = key === "Party Room Access"
            ? PARTY_ROOM_ACCESS_BY_PACKAGE[packageDetails.name.trim().toLowerCase()]
            : packageDetails[key];
          if (!value) return null;

          return (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          );
        })}
      </dl>
    </>
  );
}

export default function BirthdayHeroContactForm({ urgency = "", packageOptions = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const { siteKey, turnstileEnabled, turnstileLoading } = useTurnstileSiteKey();
  const isPrivatePartySelected = formData.selectedPackage
    .toLowerCase()
    .includes("private party");
  const packageChoices = packageOptions.map(normalizePackageOption).filter((option) => option.name);
  const selectedPackageDetails = packageChoices.find(
    (option) => option.name === formData.selectedPackage,
  );
  const isInquiryPackageSelected = Boolean(selectedPackageDetails);
  const partyTimeSlots = selectedPackageDetails
    ? getTimeSlotsForPackage(selectedPackageDetails)
    : [];

  useEffect(() => {
    const requestedPackage = searchParams.get("package") || "";
    if (!DEFAULT_PACKAGE_DURATIONS[requestedPackage.trim().toLowerCase()]) return;

    setFormData((current) => current.selectedPackage
      ? current
      : { ...current, selectedPackage: requestedPackage });
  }, [searchParams]);

  function updateField(event) {
    const { name, value } = event.target;
    if (name === "selectedPackage") {
      setStatus("");
    }
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "selectedPackage" ? { time: "" } : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (turnstileLoading || (turnstileEnabled && !turnstileToken)) {
      setStatus("Please complete the verification check.");
      return;
    }

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
          contactCompany: "",
          websiteUrl: "",
          from: "birthday-party-landing",
          selectedEvent: "BirthDay Party",
          selectedPackage: formData.selectedPackage,
          subject: `${formData.fullName} - Birthday Party Inquiry`,
          time: formData.time,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to send birthday party inquiry.");
      }

      setFormData(INITIAL_FORM);
      setTurnstileToken("");
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
      <div style={{ display: "none" }} aria-hidden="true">
        <label>
          Company
          <input name="contactCompany" tabIndex="-1" autoComplete="off" />
        </label>
        <label>
          Website
          <input name="websiteUrl" tabIndex="-1" autoComplete="off" />
        </label>
      </div>
      <div className="ppp-birthday-hero-form__head">
        <p>Plan the party</p>
        <h2>
          {isInquiryPackageSelected
            ? "Request a birthday callback"
            : "Choose your package"}
        </h2>
      </div>

      <div className="ppp-birthday-hero-form__fields">
        {packageChoices.length > 0 ? (
          <fieldset className="ppp-birthday-hero-form__packages ppp-birthday-hero-form__wide">
            <legend>Party package</legend>
            <div className="ppp-birthday-hero-form__package-grid">
              {packageChoices.map((option) => {
                return (
                  <label className="ppp-birthday-hero-form__package-option" key={option.name}>
                    <input
                      type="radio"
                      name="selectedPackage"
                      value={option.name}
                      checked={formData.selectedPackage === option.name}
                      onChange={updateField}
                      required
                    />
                    <span>
                      <strong>{option.name}</strong>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {isInquiryPackageSelected ? (
          <>
            <div className="ppp-birthday-hero-form__online ppp-birthday-hero-form__wide">
              <PackageDetails packageDetails={selectedPackageDetails} />
              <small className="ppp-birthday-hero-form__additional-person">
                * Additional person: $25 plus HST
              </small>
            </div>

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
              <select
                name="time"
                value={formData.time}
                onChange={updateField}
                disabled={packageChoices.length > 0 && !selectedPackageDetails}
              >
                <option value="">
                  {packageChoices.length > 0 && !selectedPackageDetails
                    ? "Select a package first"
                    : "Select a time slot"}
                </option>
                {partyTimeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="ppp-birthday-hero-form__choice-field">
              <span>Extra play time</span>
              <div className="ppp-birthday-hero-form__pill-group">
                {["Yes", "No"].map((option) => (
                  <label
                    className="ppp-birthday-hero-form__pill-option"
                    key={option}
                  >
                    <input
                      type="radio"
                      name="extraPlayTime"
                      value={option}
                      checked={formData.extraPlayTime === option}
                      onChange={updateField}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {isPrivatePartySelected ? (
              <p className="ppp-birthday-hero-form__note ppp-birthday-hero-form__wide">
                Looking for a private party?{" "}
                <a href={CONTACT_FORM_URL}>Send a private-party request</a>
              </p>
            ) : null}

            <label className="ppp-birthday-hero-form__wide ppp-birthday-hero-form__notes">
              <span>Party notes</span>
              <textarea
                name="message"
                value={formData.message}
                onChange={updateField}
                placeholder="Any questions, special requests, or details you'd like us to know?"
                required
              />
              {!isPrivatePartySelected ? (
                <small className="ppp-birthday-hero-form__fee-note">
                  Each additional participant beyond your package is charged{" "}
                  <strong>$25</strong>, paid at the venue.
                </small>
              ) : null}
            </label>
          </>
        ) : null}
      </div>

      {isInquiryPackageSelected && turnstileEnabled ? (
        <TurnstileWidget
          siteKey={siteKey}
          onVerify={setTurnstileToken}
          onExpire={() => setTurnstileToken("")}
          onError={() => setTurnstileToken("")}
        />
      ) : null}

      {isInquiryPackageSelected ? (
        <button
          type="submit"
          disabled={submitting || turnstileLoading || (turnstileEnabled && !turnstileToken)}
        >
          {submitting ? "Sending..." : "Send Birthday Request"}
        </button>
      ) : null}

      <p aria-live="polite">
        {status || (isInquiryPackageSelected
          ? "We will follow up with birthday package availability."
          : "Select a package to continue.")}
      </p>

      {urgency && isInquiryPackageSelected ? (
        <p className="ppp-birthday-urgency">{urgency}</p>
      ) : null}
    </form>
  );
}
