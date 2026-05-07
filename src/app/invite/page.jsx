import "../styles/invite.css";
import Image from "next/image";
import { fetchsheetdata } from "@/lib/sheets";
import { getConfigValue } from "@/lib/ctaContent";
import { LOCATION_NAME } from "@/lib/constant";

export const dynamic = "force-dynamic";
const GOOGLE_MAPS_SEARCH_URL = "https://www.google.com/maps/search/?api=1&query=";

function configText(configData, keys) {
  return getConfigValue(configData, keys);
}

function asNumber(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return null;

  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatInviteDate(value) {
  const serialDate = asNumber(value);
  if (serialDate === null || serialDate < 1) return value;

  const date = new Date(Date.UTC(1899, 11, 30) + serialDate * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatInviteTime(value) {
  const serialTime = asNumber(value);
  if (serialTime === null || serialTime < 0 || serialTime >= 1) return value;

  const totalMinutes = Math.round(serialTime * 24 * 60);
  const date = new Date(Date.UTC(1970, 0, 1, 0, totalMinutes));
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
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

function titleWithoutChildName(title = "", childName = "") {
  const cleanedTitle = String(title || "").trim();
  const cleanedChildName = String(childName || "").trim();
  if (!cleanedChildName) return cleanedTitle;

  return cleanedTitle
    .replace(new RegExp(`^${escapeRegExp(cleanedChildName)}\\s*['’]s\\s*`, "i"), "")
    .replace(new RegExp(`^${escapeRegExp(cleanedChildName)}\\s+`, "i"), "")
    .trim();
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    titleSuffix: configText(configData, ["inviteTitleSuffix", "inviteTilesuffix"]),
    intro: configText(configData, ["inviteIntro", "inviteMessage"]),
    dateLabel: configText(configData, ["inviteDateLabel"]),
    date: formatInviteDate(configText(configData, ["inviteDate"])),
    timeLabel: configText(configData, ["inviteTimeLabel"]),
    time: formatInviteTime(configText(configData, ["inviteTime"])),
    venueLabel: configText(configData, ["inviteVenueLabel"]),
    venue: configText(configData, ["inviteVenue"]),
    addressLabel: configText(configData, ["inviteAddressLabel"]),
    address: configText(configData, ["inviteAddress"]),
    waiverLabel: configText(configData, ["inviteWaiverLabel"]),
    waiverText: configText(configData, ["inviteWaiverText"]),
    waiverButton: configText(configData, ["inviteWaiverButton"]),
    waiverLink: configText(configData, ["inviteWaiverLink"]),
    rsvpLabel: configText(configData, ["inviteRsvpLabel"]),
    rsvpName: configText(configData, ["inviteRsvpName"]),
    rsvpText: configText(configData, ["inviteRsvpText"]),
    phone: configText(configData, ["invitePhone"]),
    businessPhoneLabel: configText(configData, ["inviteBusinessPhoneLabel"]),
    businessPhone: configText(configData, ["inviteBusinessPhone", "locationPhone", "pixelPulsePhone"]),
    directionsLabel: configText(configData, ["inviteDirectionsLabel"]),
    directionsText: configText(configData, ["inviteDirectionsText"]),
    directionsLink: configText(configData, ["inviteDirectionsLink", "footerMapLink", "mapsLink", "googleMapsLink"]),
    contactLinksLabel: configText(configData, ["inviteContactLinksLabel"]),
    logoAlt: configText(configData, ["inviteLogoAlt"]),
    footer: configText(configData, ["inviteFooter"]),
    websiteText: configText(configData, ["inviteWebsiteText", "inviteWebsite"]) || "www.pixelpulseplay.ca",
    websiteLink: configText(configData, ["inviteWebsiteLink", "inviteWebsiteUrl"]) || "https://www.pixelpulseplay.ca",
  };

  const telHref = `tel:${invite.phone?.replace(/[^\d+]/g, "")}`;
  const businessTelHref = `tel:${invite.businessPhone?.replace(/[^\d+]/g, "")}`;
  const configuredDirectionsLink = invite.directionsLink.trim();
  const finalDirectionsLink =
    configuredDirectionsLink || invite.address
      ? configuredDirectionsLink.startsWith("https://www.google.com/maps")
        ? configuredDirectionsLink
        : `${GOOGLE_MAPS_SEARCH_URL}${encodeURIComponent(configuredDirectionsLink || invite.address)}`
      : "";
  const titleRemainder = titleWithoutChildName(invite.title, invite.childName) || invite.titleSuffix;

  return (
    <div className="ppp-invite-page">
      <section className="ppp-invite-card" aria-labelledby="invite-title">
        <div className="ppp-invite-card__shine" aria-hidden="true" />
        <div className="ppp-invite-card__content">
          <div className="ppp-invite-balloons" aria-hidden="true">
            <span className="ppp-invite-balloon ppp-invite-balloon--one" />
            <span className="ppp-invite-balloon ppp-invite-balloon--two" />
            <span className="ppp-invite-balloon ppp-invite-balloon--three" />
            <span className="ppp-invite-balloon ppp-invite-balloon--four" />
            <span className="ppp-invite-balloon ppp-invite-balloon--five" />
          </div>
          <div className="ppp-invite-stars" aria-hidden="true">
            <span className="ppp-invite-star ppp-invite-star--one" />
            <span className="ppp-invite-star ppp-invite-star--two" />
            <span className="ppp-invite-star ppp-invite-star--three" />
          </div>
          <div className="ppp-invite-topline">
            <Image
              src="/assets/images/logo.png"
              alt={invite.logoAlt}
              width={200}
              height={200}
              className="ppp-invite-logo"
              style={{ height: "auto" }}
            />
            {invite.eyebrow ? <p className="ppp-invite-eyebrow">{invite.eyebrow}</p> : null}
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
            <a
              href={invite.waiverLink}
              className="ppp-invite-waiver__button"
              target="_blank"
              rel="noopener noreferrer"
            >
              {invite.waiverButton}
            </a>
          </div>

          {invite.phone ? <div className="ppp-invite-rsvp">
            <span>{invite.rsvpLabel}</span>
            <p>
              {invite.rsvpText} {invite.rsvpName ? `${invite.rsvpName} at ` : null}<a href={telHref}>{invite.phone}</a>
            </p>
          </div> : null}

          <div className="ppp-invite-actions" aria-label={invite.contactLinksLabel}>
            <a href={businessTelHref}>
              <span>{invite.businessPhoneLabel}</span>
              {invite.businessPhone}
            </a>
            {finalDirectionsLink ? (
              <a href={finalDirectionsLink} target="_blank" rel="noopener noreferrer">
                <span>{invite.directionsLabel}</span>
                {invite.directionsText}
              </a>
            ) : null}
          </div>

          <TextLines text={invite.footer} className="ppp-invite-footer" />
          {invite.websiteLink || invite.websiteText ? (
            <a href={invite.websiteLink || invite.websiteText} className="ppp-invite-website">
              {invite.websiteText || invite.websiteLink}
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}
