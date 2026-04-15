import Link from "next/link";
import "../../../styles/contactus.css";

export const metadata = {
  title: "Thank You | Pixel Pulse Play",
  description: "Thanks for submitting the Pixel Pulse Play contact form.",
};

export default function ContactThankYouPage() {
  return (
    <main className="ppp-contact-page">
      <section className="ppp-contact-thanks">
        <div className="aero-max-container">
          <article className="ppp-contact-thanks__card">
            <p className="ppp-contact-thanks__message">
              <span>Awesome</span>, you're one step closer to the fun!
            </p>
            <p className="ppp-contact-thanks__text">
              We will be in touch within 24 hours. If your request is urgent, please email us at{" "}
              <a href="mailto:connect@pixelpulseplay.ca">connect@pixelpulseplay.ca</a>.
            </p>
            <div className="ppp-contact-thanks__actions">
              <Link href="/" className="submit-button">
                Back to Home
              </Link>
              <Link href="/contactus" className="ppp-contact-thanks__link">
                Send another inquiry
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
