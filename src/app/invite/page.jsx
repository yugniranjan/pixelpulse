import "../styles/invite.css";
import { fetchsheetdata } from "@/lib/sheets";
import { getConfigValue } from "@/lib/ctaContent";
import { LOCATION_NAME } from "@/lib/constant";

export const dynamic = "force-dynamic";

function configText(configData, keys) {
  return getConfigValue(configData, keys);
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
    title: configText(configData, ["inviteMetaTitle"]),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function InvitePage() {
  const locationSlug = LOCATION_NAME || "vaughan";
  const configData = await fetchsheetdata("config", locationSlug);

  const invite = {
    eyebrow: configText(configData, ["inviteEyebrow"]),
    greeting: configText(configData, ["inviteGreeting"]),
    guestName: configText(configData, ["inviteGuestName"]),
    childName: configText(configData, ["inviteChildName"]),
    title: configText(configData, ["inviteTitle"]),
    titleSuffix: configText(configData, ["inviteTitleSuffix"]),
    intro: configText(configData, ["inviteIntro", "inviteMessage"]),
    dateLabel: configText(configData, ["inviteDateLabel"]),
    date: configText(configData, ["inviteDate"]),
    timeLabel: configText(configData, ["inviteTimeLabel"]),
    time: configText(configData, ["inviteTime"]),
    venueLabel: configText(configData, ["inviteVenueLabel"]),
    venue: configText(configData, ["inviteVenue"]),
    addressLabel: configText(configData, ["inviteAddressLabel"]),
    address: configText(configData, ["inviteAddress"]),
    waiverLabel: configText(configData, ["inviteWaiverLabel"]),
    waiverText: configText(configData, ["inviteWaiverText"]),
    waiverButton: configText(configData, ["inviteWaiverButton"]),
    rsvpLabel: configText(configData, ["inviteRsvpLabel"]),
    rsvpText: configText(configData, ["inviteRsvpText"]),
    phone: configText(configData, ["invitePhone", "footerPhone", "contactPhone"]),
    businessPhoneLabel: configText(configData, ["inviteBusinessPhoneLabel"]),
    businessPhone: configText(configData, ["inviteBusinessPhone", "locationPhone", "pixelPulsePhone"]),
    directionsLabel: configText(configData, ["inviteDirectionsLabel"]),
    directionsText: configText(configData, ["inviteDirectionsText"]),
    directionsLink: configText(configData, ["inviteDirectionsLink", "footerMapLink", "mapsLink", "googleMapsLink"]),
    contactLinksLabel: configText(configData, ["inviteContactLinksLabel"]),
    logoAlt: configText(configData, ["inviteLogoAlt"]),
    footer: configText(configData, ["inviteFooter"]),
  };

  const telHref = `tel:${invite.phone.replace(/[^\d+]/g, "")}`;
  const businessTelHref = `tel:${invite.businessPhone.replace(/[^\d+]/g, "")}`;
  const finalWaiverLink = configText(configData, ["inviteWaiverLink"]);
  const titleRemainder =
    invite.title
      .replace(invite.childName, "")
      .replace(/^['’]s\s*/i, "")
      .trim() || invite.titleSuffix;

  return (
    <div className="ppp-invite-page">
      <section className="ppp-invite-card" aria-labelledby="invite-title">
        <div className="ppp-invite-card__shine" aria-hidden="true" />
        <div className="ppp-invite-card__content">
          <div className="ppp-invite-topline">
            <img src="/assets/images/logo.png" alt={invite.logoAlt} className="ppp-invite-logo" />
            <p className="ppp-invite-eyebrow">{invite.eyebrow}</p>
          </div>
          <TextLines text={invite.greeting} className="ppp-invite-greeting" />
          <div className="ppp-invite-hero-copy">
            <h1 id="invite-title">
              {invite.childName ? <span>{`${invite.childName}'s`}</span> : null}
              {titleRemainder}
            </h1>
            <TextLines text={invite.guestName} className="ppp-invite-guest" />
            <TextLines text={invite.intro} className="ppp-invite-intro" />
          </div>

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
