"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../../styles/contactus.css";
import { LOCATION_NAME } from "@/lib/constant";
import { useTurnstileSiteKey } from "@/lib/useTurnstileSiteKey";
import { toast } from "sonner";
import TurnstileWidget from "./TurnstileWidget";

const CONTACT_EMAIL = "connect@pixelpulseplay.ca";
const CONTACT_PHONE = "+1 (905) 760-2922";
const birthdayPackageNotice =
  "Birthday party packages include a hosted party experience and party room time, but they do not reserve the entire facility or play area for private use.";
const PARTY_SLOT_STARTS = [
  { label: "10:30 AM", minutes: 10 * 60 + 30 },
  { label: "1:00 PM", minutes: 13 * 60 },
  { label: "3:30 PM", minutes: 15 * 60 + 30 },
  { label: "6:00 PM", minutes: 18 * 60 },
];
const BIRTHDAY_PACKAGE_OPTIONS = [
  { name: "Pixel Punch", duration: 105 },
  { name: "Pixel Ultra", duration: 120 },
  { name: "Pixel Jumbo", duration: 150 },
  { name: "Pulse Max", duration: 180 },
];

function formatMinutes(totalMinutes) {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function getTimeSlotsForPackage(packageName) {
  const selectedPackage = BIRTHDAY_PACKAGE_OPTIONS.find((option) => option.name === packageName);
  if (!selectedPackage) return [];

  return PARTY_SLOT_STARTS.map(
    (slot) => `${slot.label} - ${formatMinutes(slot.minutes + selectedPackage.duration)}`,
  );
}

function ContactForm() {
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const { siteKey, turnstileEnabled, turnstileLoading } = useTurnstileSiteKey();
  const [formData, setFormData] = useState({
    from: LOCATION_NAME,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    selectedPackage: "",
    extraPlayTime: "",
    message: "",
    selectedEvent: "",
  });
  const isBirthdayInquiry = formData.selectedEvent === "BirthDay";
  const isPrivatePartyInquiry = formData.selectedEvent === "Private Party";
  const birthdayTimeSlots = getTimeSlotsForPackage(formData.selectedPackage);
  useEffect(() => {
    const currentUrl = window.location.href;
    const pathSegments = new URL(currentUrl).pathname.split("/");
    const locationSegment = pathSegments[1]; 
    setCurrentLocation(locationSegment); 
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "selectedEvent" && value !== "BirthDay"
        ? { selectedPackage: "", time: "", extraPlayTime: "" }
        : {}),
      ...(name === "selectedPackage"
        ? { time: "" }
        : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.phone.trim()) {
      toast.error("Please enter your phone number.");
      setSubmitStatus("Please enter your phone number.");
      return;
    }

    if (turnstileLoading || (turnstileEnabled && !turnstileToken)) {
      toast.error("Please complete the verification check.");
      setSubmitStatus("Please complete the verification check.");
      return;
    }

    setSubmitting(true);
    setSubmitStatus("Sending your inquiry...");
    try {
      const payload = {
        ...formData,
        contactCompany: "",
        websiteUrl: "",
        from: currentLocation || LOCATION_NAME,
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        locationEmail: CONTACT_EMAIL,
        subject: `${formData.firstName} ${formData.lastName} - Pixel Pulse Play Zone (Inquiry)`.trim(),
        turnstileToken,
      };

      const response = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Email send failed");
      }

      toast.success("Your message has been sent successfully.");
      setSubmitStatus("Your inquiry was sent successfully.");
      setTurnstileToken("");
      window.sessionStorage.setItem("pppContactEmail", formData.email);
      router.push("/contactus/thank-you");
    } catch (error) {
      toast.error("We could not send your inquiry. Please try again later.");
      setSubmitStatus("We could not send your inquiry. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ppp-contact-form-shell">
      <form className="contact-form" onSubmit={handleSubmit} aria-busy={submitting}>
        <p className="sr-only" aria-live="polite">{submitStatus}</p>
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
        <div className="ppp-contact-form__grid">
          <div className="form-group">
            <label htmlFor="firstName">First Name <span>*</span></label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              autoComplete="given-name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name <span>*</span></label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              autoComplete="family-name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address <span>*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              inputMode="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number <span>*</span></label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              autoComplete="tel"
              inputMode="tel"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Preferred Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group form-group--full">
            <label htmlFor="selectedEvent">Inquiry Type</label>
            <select
              id="selectedEvent"
              name="selectedEvent"
              value={formData.selectedEvent}
              onChange={handleChange}
              required
            >
              <option value="">Select an event or inquiry type</option>
              <option value="BirthDay">BirthDay Party</option>
              <option value="Private Party">Private Party</option>
              <option value="Group Booking">Group Booking</option>
              <option value="Fund Raisers">Fund Raisers</option>
              <option value="Others">Others</option>
            </select>
            {isBirthdayInquiry ? (
              <p className="ppp-contact-form__note">
                <strong>Birthday package note:</strong> {birthdayPackageNotice} If you are looking for a private party, choose Private Party or contact us directly by phone or email.
              </p>
            ) : null}
            {isPrivatePartyInquiry ? (
              <p className="ppp-contact-form__note">
                For private-party access, send us your preferred date, group size, and timing. You can also call {CONTACT_PHONE} or email {CONTACT_EMAIL}.
              </p>
            ) : null}
          </div>

          {isBirthdayInquiry ? (
            <div className="form-group form-group--full">
              <label htmlFor="selectedPackage">Party Package</label>
              <select
                id="selectedPackage"
                name="selectedPackage"
                value={formData.selectedPackage}
                onChange={handleChange}
              >
                <option value="">Select a package</option>
                {BIRTHDAY_PACKAGE_OPTIONS.map((option) => (
                  <option key={option.name} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {isBirthdayInquiry ? (
            <div className="form-group form-group--full">
              <label htmlFor="time">Preferred Time</label>
              <select
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                disabled={!formData.selectedPackage}
              >
                <option value="">
                  {formData.selectedPackage ? "Select a time slot" : "Select a package first"}
                </option>
                {birthdayTimeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {isBirthdayInquiry ? (
            <fieldset className="form-group form-group--full ppp-contact-form__choice-field">
              <legend>Extra Play Time</legend>
              <div className="ppp-contact-form__pill-group">
                {["Yes", "No"].map((option) => (
                  <label className="ppp-contact-form__pill-option" key={option}>
                    <input
                      type="radio"
                      name="extraPlayTime"
                      value={option}
                      checked={formData.extraPlayTime === option}
                      onChange={handleChange}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <div className="form-group form-group--full">
            <label htmlFor="message">{isBirthdayInquiry ? "Party Notes" : "Message"}</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder={
                isBirthdayInquiry
                  ? "Any questions, special requests, or details you'd like us to know?"
                  : undefined
              }
              autoComplete="off"
              required
            />
          </div>
        </div>

        {turnstileEnabled ? (
          <TurnstileWidget
            siteKey={siteKey}
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken("")}
            onError={() => setTurnstileToken("")}
          />
        ) : null}

        <button
          type="submit"
          className="submit-button"
          disabled={submitting || turnstileLoading || (turnstileEnabled && !turnstileToken)}
        >
          {submitting ? "Sending..." : "Send Inquiry"}
        </button>
      </form>
    </div>
  );
}

export default ContactForm;
