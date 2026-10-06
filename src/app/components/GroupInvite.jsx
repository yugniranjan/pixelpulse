import Image from "next/image";
import { FaBriefcase, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers } from "react-icons/fa";
import "../styles/group-invite.css";
import { GROUP_INVITE_DEFAULTS } from "@/lib/groupInvites";

function displayDate(value = "") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "America/Toronto" }).format(date);
}

export default function GroupInvite({ invite }) {
  const isCorporate = invite.eventType !== "adult";
  const phoneLink = `tel:${String(invite.phone || "").replace(/[^\d+]/g, "")}`;
  const directions = invite.directionsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invite.address || "")}`;
  const EventIcon = isCorporate ? FaBriefcase : FaUsers;

  return (
    <main className="ppp-group-invite">
      <header className="ppp-group-invite-header"><div className="ppp-group-invite-brand">
        <a href="/" aria-label="Pixel Pulse Play home">
          <Image src="/assets/images/logo.png" alt="Pixel Pulse Play" width={168} height={60} priority />
        </a>
        <span>{isCorporate ? "Corporate & team events" : "Adult group events"}</span>
      </div></header>
      <section className="ppp-group-invite-hero" aria-labelledby="group-invite-title">
        <Image src="/assets/images/floorchallenge.webp" alt="Glowing interactive floor tiles at Pixel Pulse Play" fill sizes="100vw" priority />
        <div className="ppp-group-invite-tiles" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
        </div>
        <div className="ppp-group-invite-hero__copy">
          <span className="ppp-group-invite-eyebrow"><EventIcon aria-hidden="true" /> {invite.eyebrow || "Group invitation"}</span>
          <h1 id="group-invite-title">{invite.childName}</h1>
          <p className="ppp-group-invite-title">{invite.title || GROUP_INVITE_DEFAULTS.title}</p>
          <p>{invite.guestName || GROUP_INVITE_DEFAULTS.guestName}</p>
        </div>
      </section>
      <div className="ppp-group-invite-content">
        <p className="ppp-group-invite-intro">{invite.intro || GROUP_INVITE_DEFAULTS.intro}</p>
        <dl className="ppp-group-invite-details">
          <div><dt><FaCalendarAlt aria-hidden="true" /> Date</dt><dd>{displayDate(invite.date)}</dd></div>
          <div><dt><FaClock aria-hidden="true" /> Event time</dt><dd>{invite.time}</dd></div>
          <div><dt><FaMapMarkerAlt aria-hidden="true" /> Venue</dt><dd>{invite.venue || "Pixel Pulse Play"}<small>{invite.address}</small></dd></div>
          <div><dt><FaUsers aria-hidden="true" /> Group ID</dt><dd>{invite.groupId || invite.partyId}</dd></div>
        </dl>
        <section className="ppp-group-invite-waiver">
          <div><h2>Ready for your group visit?</h2><p>{invite.waiverText || GROUP_INVITE_DEFAULTS.waiverText}</p></div>
          <a href={invite.waiverLink}>{invite.waiverButton || "Complete waiver"}</a>
        </section>
        <section className="ppp-group-invite-organizer">
          <div><h2>RSVP to your organizer</h2><p>{invite.rsvpName}</p><a href={phoneLink}>{invite.phone}</a></div>
          <a href={directions} target="_blank" rel="noopener noreferrer">Get directions</a>
        </section>
        <footer className="ppp-group-invite-footer">
          <p>{invite.footer || GROUP_INVITE_DEFAULTS.footer}</p>
          <a href={invite.websiteLink || "https://www.pixelpulseplay.ca"}>{invite.websiteText || "www.pixelpulseplay.ca"}</a>
        </footer>
      </div>
    </main>
  );
}
