import React from 'react'
import '../../styles/contactus.css'
import ContactForm from '@/components/smallComponents/ContactForm';
import SectionHeading from '@/components/home/SectionHeading';

const page = () => {
  return (
    <main className="ppp-contact-page">
      <section className="ppp-contact-hero">
        <div className="aero-max-container ppp-contact-hero__inner">
          <div className="ppp-contact-hero__copy">
            <span className="ppp-contact-hero__eyebrow">Contact Pixel Pulse Play</span>
            <h1 className="aero_contact-mainheading">Let&apos;s Plan Your Visit</h1>
            <p className="ppp-contact-hero__text">
              Reach out for admissions, birthday parties, group events, camp questions,
              or anything else you want to plan with the Pixel Pulse Play team.
            </p>
          </div>

          <div className="ppp-contact-hero__panel">
            <div className="ppp-contact-hero-card">
              <span className="ppp-contact-hero-card__label">Fastest way to connect</span>
              <h2>Send us the key details and we&apos;ll help you sort out the best next step.</h2>
              <ul>
                <li>Ask about parties, bookings, and visit planning</li>
                <li>Share your preferred date and time if you have one</li>
                <li>Get a response with the right info for your inquiry</li>
              </ul>
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
