"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../../styles/contactus.css";
import { LOCATION_NAME } from "@/lib/constant";
import { toast } from "sonner";
import { fetchsheetdata } from "@/lib/sheets";

function ContactForm() {
  const router = useRouter();
  const location_slug = LOCATION_NAME;
  const [currentLocation, setCurrentLocation] = useState("");
  const [formData, setFormData] = useState({
    from: LOCATION_NAME,
    fullName: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    message: "",
    selectedEvent: "",
  });

  const [dataconfig, setDataconfig] = useState([]);

  useEffect(() => {
    const getData = async () => {
      const data = await fetchsheetdata("locations", location_slug);
      setDataconfig(data);
    };
    getData();
  }, []);

 const email = dataconfig?.find(item => item.email)?.email;

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
    formData.locationEmail = `${email}`;
    formData.subject = `New Inquiry: ${formData.selectedEvent} at ${currentLocation} - ${formData.fullName} (${formData.date} ${formData.time})`;
    e.preventDefault();
    try {

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Your message has been sent successfully! We will get back to you shortly.");
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          date: "",
          time: "",
          message: "",
          selectedEvent: "",
        });
      } else {
        toast.error("Failed to send your message. Please try again later.");
      }
    } catch (error) {
      toast.error("An error occurred while sending your message. Please try again later.");
    }
  };

  return (
    <div>
      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            type="number"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Date (yyyy-mm-dd)</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="time">Time</label>
          <select
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
          >
            <option value="">--Select a Time--</option>
            {generateTimeOptions()}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="selectedEvent">Select Event</label>
          <select
            id="selectedEvent"
            name="selectedEvent"
            value={formData.selectedEvent}
            onChange={handleChange}
            required
          >
            <option value="">--Select an Event--</option>
            <option value="BirthDay">BirthDay Party</option>
            <option value="Group Booking">Group Booking</option>
            <option value="Admission">Admission</option>
            <option value="Camp">Camp</option>
            <option value="Fund Raisers">Fund Raisers</option>
            <option value="Others">Others</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="message">Enter Message</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="submit-button">
          Send
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