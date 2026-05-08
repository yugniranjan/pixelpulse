import React from 'react'
import '../../styles/contactus.css'
import ContactForm from '@/components/smallComponents/ContactForm';
import SectionHeading from '@/components/home/SectionHeading';
import { canonicalUrl } from '@/lib/seo';

export const metadata = {
  title: "Contact Pixel Pulse Play Vaughan",
  description:
    "Contact Pixel Pulse Play in Vaughan for birthday parties, group bookings, fundraisers, and visit planning.",
  alternates: {
    canonical: canonicalUrl("/contactus"),
  },
};

const page = () => {
  return (
    <main className="ppp-contact-page">
      <section className="ppp-contact-hero">
        <div className="aero-max-container ppp-contact-hero__inner">
          <div className="ppp-contact-hero__copy">
            <span className="ppp-contact-hero__eyebrow">Contact Pixel Pulse Play</span>
            <h1 className="aero_contact-mainheading">Let&apos;s Plan Your Visit</h1>
            <p className="ppp-contact-hero__text">
              Reach out for birthday parties, group bookings, fundraisers,
              or anything else you want to plan with the Pixel Pulse Play team.
            </p>
            <div className="ppp-contact-hero__details" aria-label="Contact details">
              <div className="ppp-contact-hero__detail">
                <span>Phone</span>
                <a href="tel:+19057602922">+1 (905) 760-2922</a>
              </div>
              <div className="ppp-contact-hero__detail">
                <span>Email</span>
                <a href="mailto:connect@pixelpulseplay.ca">connect@pixelpulseplay.ca</a>
              </div>
              <div className="ppp-contact-hero__detail">
                <span>Location</span>
                <a
                  href="https://maps.app.goo.gl/anxfwSCGYZNpNmnC7"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  960 Edgeley Blvd #2, Vaughan, ON L4K 4V4
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ppp-contact-section">
        <div className="aero-max-container ppp-contact-layout">
          <article className="ppp-contact-card">
            <SectionHeading className="section-heading-white" mainHeading={true}>
              Contact <span>Us</span>
            </SectionHeading>
            <p className="ppp-contact-card__text">
              Fields marked with * are required. Please include as much detail as you can so we can help faster.
            </p>
            <ContactForm />
          </article>
        </div>
      </section>
    </main>
  );
}

export default page
