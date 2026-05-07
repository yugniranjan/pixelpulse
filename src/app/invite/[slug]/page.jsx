import "../../styles/invite.css";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchsheetdata } from "@/lib/sheets";
import { getConfigValue, getRowValue } from "@/lib/ctaContent";
import { LOCATION_NAME } from "@/lib/constant";
import { getInviteBySlug } from "@/lib/invites";

export const dynamic = "force-dynamic";

const GOOGLE_MAPS_SEARCH_URL = "https://www.google.com/maps/search/?api=1&query=";

function configText(configData, keys) {
  return getConfigValue(configData, keys);
}

function inviteText(inviteRow, configData, keys) {
  return getRowValue(inviteRow, keys) || configText(configData, keys);
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

function DetailCard({ label, value }) {
  if (!label && !value) return null;

  return (
    <div>
      {label ? <dt>{label}</dt> : null}
      {value ? <dd>{value}</dd> : null}
    </div>
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

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const locationSlug = LOCATION_NAME || "vaughan";
  const [configData, inviteRow] = await Promise.all([
    fetchsheetdata("config", locationSlug),
    getInviteBySlug(slug),
  ]);

  return {
    title:
      inviteRow
        ? inviteText(inviteRow, configData, ["metaTitle", "inviteMetaTitle", "title"])
        : configText(configData, ["inviteMetaTitle"]),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function InviteSlugPage({ params }) {
  const { slug } = await params;
  const locationSlug = LOCATION_NAME || "vaughan";
  const [configData, inviteRow] = await Promise.all([
    fetchsheetdata("config", locationSlug),
    getInviteBySlug(slug),
  ]);

  if (!inviteRow) {
    notFound();
  }

  const invite = {
    eyebrow: inviteText(inviteRow, configData, ["eyebrow", "inviteEyebrow"]),
    greeting: inviteText(inviteRow, configData, ["greeting", "inviteGreeting"]),
    guestName: inviteText(inviteRow, configData, ["guestName", "inviteGuestName"]),
    childName: inviteText(inviteRow, configData, ["childName", "inviteChildName"]),
    title: inviteText(inviteRow, configData, ["title", "inviteTitle"]),
    titleSuffix: inviteText(inviteRow, configData, ["titleSuffix", "tilesuffix", "inviteTitleSuffix"]),
    intro: inviteText(inviteRow, configData, ["intro", "message", "inviteIntro", "inviteMessage"]),
    dateLabel: inviteText(inviteRow, configData, ["dateLabel", "inviteDateLabel"]),
    date: formatInviteDate(inviteText(inviteRow, configData, ["date", "inviteDate"])),
    timeLabel: inviteText(inviteRow, configData, ["timeLabel", "inviteTimeLabel"]),
    time: formatInviteTime(inviteText(inviteRow, configData, ["time", "inviteTime"])),
    venueLabel: inviteText(inviteRow, configData, ["venueLabel", "inviteVenueLabel"]),
    venue: inviteText(inviteRow, configData, ["venue", "inviteVenue"]),
    addressLabel: inviteText(inviteRow, configData, ["addressLabel", "inviteAddressLabel"]),
    address: inviteText(inviteRow, configData, ["address", "inviteAddress"]),
    waiverLabel: inviteText(inviteRow, configData, ["waiverLabel", "inviteWaiverLabel"]),
    waiverText: inviteText(inviteRow, configData, ["waiverText", "inviteWaiverText"]),
    waiverButton: inviteText(inviteRow, configData, ["waiverButton", "inviteWaiverButton"]),
    waiverLink: inviteText(inviteRow, configData, ["waiverLink", "inviteWaiverLink"]),
    rsvpLabel: inviteText(inviteRow, configData, ["rsvpLabel", "inviteRsvpLabel"]),
    rsvpName: inviteText(inviteRow, configData, ["rsvpName", "inviteRsvpName"]),
    rsvpText: inviteText(inviteRow, configData, ["rsvpText", "inviteRsvpText"]),
    phone: inviteText(inviteRow, configData, ["phone", "rsvpPhone", "invitePhone"]),
    businessPhoneLabel: inviteText(inviteRow, configData, ["businessPhoneLabel", "inviteBusinessPhoneLabel"]),
    businessPhone: inviteText(inviteRow, configData, ["businessPhone", "inviteBusinessPhone", "locationPhone", "pixelPulsePhone"]),
    directionsLabel: inviteText(inviteRow, configData, ["directionsLabel", "inviteDirectionsLabel"]),
    directionsText: inviteText(inviteRow, configData, ["directionsText", "inviteDirectionsText"]),
    directionsLink: inviteText(inviteRow, configData, ["directionsLink", "inviteDirectionsLink", "googleMapsLink"]),
    contactLinksLabel: inviteText(inviteRow, configData, ["contactLinksLabel", "inviteContactLinksLabel"]),
    logoAlt: inviteText(inviteRow, configData, ["logoAlt", "inviteLogoAlt"]),
    footer: inviteText(inviteRow, configData, ["footer", "inviteFooter"]),
    websiteText: inviteText(inviteRow, configData, ["websiteText", "website", "inviteWebsiteText", "inviteWebsite"]),
    websiteLink: inviteText(inviteRow, configData, ["websiteLink", "websiteUrl", "inviteWebsiteLink", "inviteWebsiteUrl"]),
  };

  const telHref = invite.phone ? `tel:${invite.phone?.replace(/[^\d+]/g, "")}` : "";
  const businessTelHref = invite.businessPhone
    ? `tel:${invite.businessPhone?.replace(/[^\d+]/g, "")}`
    : "";
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
            <DetailCard label={invite.dateLabel} value={invite.date} />
            <DetailCard label={invite.timeLabel} value={invite.time} />
            <DetailCard label={invite.venueLabel} value={invite.venue} />
            <DetailCard label={invite.addressLabel} value={invite.address} />
          </dl>

          {invite.waiverLabel || invite.waiverText || invite.waiverLink ? (
            <div className="ppp-invite-waiver">
              <div>
                {invite.waiverLabel ? <strong>{invite.waiverLabel}</strong> : null}
                <TextLines text={invite.waiverText} />
              </div>
              {invite.waiverLink ? (
                <a
                  href={invite.waiverLink}
                  className="ppp-invite-waiver__button"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {invite.waiverButton}
                </a>
              ) : null}
            </div>
          ) : null}

          {invite.phone ? (
            <div className="ppp-invite-rsvp">
              {invite.rsvpLabel ? <span>{invite.rsvpLabel}</span> : null}
              <p>
                {invite.rsvpText} {invite.rsvpName ? `${invite.rsvpName} at ` : null}<a href={telHref}>{invite.phone}</a>
              </p>
            </div>
          ) : null}

          {businessTelHref || finalDirectionsLink ? (
            <div className="ppp-invite-actions" aria-label={invite.contactLinksLabel}>
              {businessTelHref ? (
                <a href={businessTelHref}>
                  <span>{invite.businessPhoneLabel}</span>
                  {invite.businessPhone}
                </a>
              ) : null}
              {finalDirectionsLink ? (
                <a href={finalDirectionsLink} target="_blank" rel="noopener noreferrer">
                  <span>{invite.directionsLabel}</span>
                  {invite.directionsText}
                </a>
              ) : null}
            </div>
          ) : null}

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
