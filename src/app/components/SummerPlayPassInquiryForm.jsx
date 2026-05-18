"use client";

import { useState } from "react";
import { toast } from "sonner";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  date: "",
  selectedEvent: "Summer Play Pass",
  message: "",
};

export default function SummerPlayPassInquiryForm({ passOptions = [] }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.phone.trim()) {
      setStatus("Please enter your phone number.");
      toast.error("Please enter your phone number.");
      return;
    }

    setSubmitting(true);
    setStatus("Sending your summer pass inquiry...");

    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          from: "Summer Play Pass",
          time: "",
          message:
            formData.message ||
            `Interested in ${formData.selectedEvent || "Summer Play Pass"}.`,
        }),
      });

      if (!response.ok) {
        throw new Error("Summer Play Pass inquiry failed");
      }

      setFormData(INITIAL_FORM);
      setStatus("Your inquiry was sent. We will follow up soon.");
      toast.success("Your inquiry was sent. We will follow up soon.");
    } catch {
      setStatus("We could not send your inquiry. Please try again later.");
      toast.error("We could not send your inquiry. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="ppp-summer-inquiry" onSubmit={handleSubmit} aria-busy={submitting}>
      <div>
        <span>Summer Pass Inquiry</span>
        <h2>Plan Your Pass</h2>
      </div>
      <p className="sr-only" aria-live="polite">{status}</p>
      <label>
        <span>Name</span>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          autoComplete="name"
          required
        />
      </label>
      <label>
        <span>Email</span>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />
      </label>
      <label>
        <span>Phone</span>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          autoComplete="tel"
          required
        />
      </label>
      <div className="ppp-summer-inquiry__row">
        <label>
          <span>Pass</span>
          <select name="selectedEvent" value={formData.selectedEvent} onChange={handleChange}>
            <option value="Summer Play Pass">Summer Play Pass</option>
            {passOptions.map((option) => (
              <option value={option} key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Date</span>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
          />
        </label>
      </div>
      <label>
        <span>Message</span>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Tell us who is playing and when you want to visit."
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? "Sending..." : "Send Inquiry"}
      </button>
      {status && <p className="ppp-summer-inquiry__status">{status}</p>}
    </form>
  );
}
