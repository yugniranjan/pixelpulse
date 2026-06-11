"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../../styles/contactus.css";
import { LOCATION_NAME } from "@/lib/constant";
import { toast } from "sonner";
import TurnstileWidget from "./TurnstileWidget";

const CONTACT_EMAIL = "connect@pixelpulseplay.ca";
const TURNSTILE_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

function ContactForm() {
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [formData, setFormData] = useState({
    from: LOCATION_NAME,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    message: "",
    selectedEvent: "",
  });
  useEffect(() => {
    const currentUrl = window.location.href;
    const pathSegments = new URL(currentUrl).pathname.split("/");
    const locationSegment = pathSegments[1]; 
    setCurrentLocation(locationSegment); 
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.phone.trim()) {
      toast.error("Please enter your phone number.");
      setSubmitStatus("Please enter your phone number.");
      return;
    }

    if (TURNSTILE_ENABLED && !turnstileToken) {
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

          <div className="form-group">
            <label htmlFor="time">Preferred Time</label>
            <select
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
            >
              <option value="">Select a time</option>
              {generateTimeOptions()}
            </select>
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
          </div>

          <div className="form-group form-group--full">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              autoComplete="off"
              required
            />
          </div>
        </div>

        {TURNSTILE_ENABLED ? (
          <TurnstileWidget
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken("")}
            onError={() => setTurnstileToken("")}
          />
        ) : null}

        <button
          type="submit"
          className="submit-button"
          disabled={submitting || (TURNSTILE_ENABLED && !turnstileToken)}
        >
          {submitting ? "Sending..." : "Send Inquiry"}
        </button>
      </form>
    </div>
  );
}

function generateTimeOptions() {
  const times = [];
  let currentHour = 10;
  let currentMinute = 0;

  while (currentHour < 21 || (currentHour === 21 && currentMinute === 0)) {
    const hourString = currentHour < 10 ? `0${currentHour}` : `${currentHour}`;
    const minuteString = currentMinute === 0 ? "00" : `${currentMinute}`;
    const timeString = `${hourString}:${minuteString}`;

    const displayTime = new Date(
      `1970-01-01T${timeString}:00`
    ).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    times.push(
      <option key={timeString} value={timeString}>
        {displayTime}
      </option>
    );

    currentMinute += 30;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour += 1;
    }
  }

  return times;
}

export default ContactForm;
