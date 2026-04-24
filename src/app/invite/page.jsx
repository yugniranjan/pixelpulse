import "../styles/invite.css";
import { fetchsheetdata, getWaiverLink } from "@/lib/sheets";
import { getConfigValue } from "@/lib/ctaContent";
import { LOCATION_NAME } from "@/lib/constant";

export const dynamic = "force-dynamic";

function configText(configData, keys, fallback = "") {
  return getConfigValue(configData, keys) || fallback;
}

function TextLines({ text, as: Tag = "p", className = "" }) {
  const parts = String(text || "")
    .split(/<br\s*\/?>|\n/gi)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <Tag className={className}>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {part}
          {index < parts.length - 1 ? <br /> : null}
        </span>
      ))}
    </Tag>
  );
}

export async function generateMetadata() {
  const locationSlug = LOCATION_NAME || "vaughan";
  const configData = await fetchsheetdata("config", locationSlug);

  return {
    title: configText(configData, ["inviteMetaTitle"], "Birthday Invite | Pixel Pulse Play"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function InvitePage() {
  const locationSlug = LOCATION_NAME || "vaughan";
  const [configData, waiverLink] = await Promise.all([
    fetchsheetdata("config", locationSlug),
    getWaiverLink(locationSlug),
  ]);

  const invite = {
    eyebrow: configText(configData, ["inviteEyebrow"], "Birthday Invite"),
    greeting: configText(configData, ["inviteGreeting"], "Hi,"),
    guestName: configText(configData, ["inviteGuestName"], "You are invited!"),
    childName: configText(configData, ["inviteChildName"], "Ariana"),
    title: configText(configData, ["inviteTitle"], "Ariana's Birthday Party"),
    titleSuffix: configText(configData, ["inviteTitleSuffix"], "Birthday Party"),
    intro: configText(
      configData,
      ["inviteIntro", "inviteMessage"],
      "Join us for a high-energy birthday celebration at Pixel Pulse Playzone.",
    ),
    dateLabel: configText(configData, ["inviteDateLabel"], "Date"),
    date: configText(configData, ["inviteDate"], "Saturday, April 26, 2026"),
    timeLabel: configText(configData, ["inviteTimeLabel"], "Time"),
    time: configText(configData, ["inviteTime"], "4:00 PM"),
    venueLabel: configText(configData, ["inviteVenueLabel"], "Place"),
    venue: configText(configData, ["inviteVenue"], "Pixel Pulse Playzone"),
    addressLabel: configText(configData, ["inviteAddressLabel"], "Address"),
    address: configText(configData, ["inviteAddress"], "Vaughan, ON"),
    waiverLabel: configText(configData, ["inviteWaiverLabel"], "Waiver"),
    waiverText: configText(
      configData,
      ["inviteWaiverText"],
      "Please complete the waiver before the party.",
    ),
    waiverButton: configText(configData, ["inviteWaiverButton"], "Complete waiver"),
    rsvpLabel: configText(configData, ["inviteRsvpLabel"], "RSVP"),
    rsvpText: configText(configData, ["inviteRsvpText"], "Please text or call"),
    phone: configText(configData, ["invitePhone", "footerPhone", "contactPhone"], "416-561-5667"),
    businessPhoneLabel: configText(configData, ["inviteBusinessPhoneLabel"], "Pixel Pulse Phone"),
    businessPhone: configText(
      configData,
      ["inviteBusinessPhone", "locationPhone", "pixelPulsePhone"],
      "905-553-7444",
    ),
    directionsLabel: configText(configData, ["inviteDirectionsLabel"], "Directions"),
    directionsText: configText(configData, ["inviteDirectionsText"], "Open map"),
    directionsLink: configText(
      configData,
      ["inviteDirectionsLink", "footerMapLink", "mapsLink", "googleMapsLink"],
      "https://www.google.com/maps/search/?api=1&query=Pixel%20Pulse%20Playzone%20Vaughan",
    ),
    contactLinksLabel: configText(configData, ["inviteContactLinksLabel"], "Pixel Pulse contact links"),
    footer: configText(configData, ["inviteFooter"], "We can't wait to celebrate with you!"),
  };

  const telHref = `tel:${invite.phone.replace(/[^\d+]/g, "")}`;
  const businessTelHref = `tel:${invite.businessPhone.replace(/[^\d+]/g, "")}`;
  const finalWaiverLink = configText(configData, ["inviteWaiverLink"], waiverLink || "/waiver");

  return (
    <div className="ppp-invite-page">
      <section className="ppp-invite-card" aria-labelledby="invite-title">
        <div className="ppp-invite-card__shine" aria-hidden="true" />
        <div className="ppp-invite-card__content">
          <p className="ppp-invite-eyebrow">{invite.eyebrow}</p>
          <TextLines text={invite.greeting} className="ppp-invite-greeting" />
          <h1 id="invite-title">
            <span>{`${invite.childName}'s`}</span>
            {invite.title
              .replace(invite.childName, "")
              .replace(/^['’]s\s*/i, "")
              .trim() || invite.titleSuffix}
          </h1>
          <TextLines text={invite.guestName} className="ppp-invite-guest" />
          <TextLines text={invite.intro} className="ppp-invite-intro" />

          <dl className="ppp-invite-details">
            <div>
              <dt>{invite.dateLabel}</dt>
              <dd>{invite.date}</dd>
            </div>
            <div>
              <dt>{invite.timeLabel}</dt>
              <dd>{invite.time}</dd>
            </div>
            <div>
              <dt>{invite.venueLabel}</dt>
              <dd>{invite.venue}</dd>
            </div>
            <div>
              <dt>{invite.addressLabel}</dt>
              <dd>{invite.address}</dd>
            </div>
          </dl>

          <div className="ppp-invite-waiver">
            <div>
              <strong>{invite.waiverLabel}</strong>
              <TextLines text={invite.waiverText} />
            </div>
            <a href={finalWaiverLink} className="ppp-invite-waiver__button">
              {invite.waiverButton}
            </a>
          </div>

          <div className="ppp-invite-rsvp">
            <span>{invite.rsvpLabel}</span>
            <p>
              {invite.rsvpText} <a href={telHref}>{invite.phone}</a>
            </p>
          </div>

          <div className="ppp-invite-actions" aria-label={invite.contactLinksLabel}>
            <a href={businessTelHref}>
              <span>{invite.businessPhoneLabel}</span>
              {invite.businessPhone}
            </a>
            <a href={invite.directionsLink}>
              <span>{invite.directionsLabel}</span>
              {invite.directionsText}
            </a>
          </div>

          <TextLines text={invite.footer} className="ppp-invite-footer" />
        </div>
      </section>
    </div>
  );
}
