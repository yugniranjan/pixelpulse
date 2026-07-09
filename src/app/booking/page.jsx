import Link from "next/link";
import BookingChooser from "./BookingChooser";
import "../styles/booking-page.css";
import { LOCATION_NAME } from "@/lib/constant";
import { getConfigValue, getRowValue } from "@/lib/ctaContent";
import { fetchsheetdata } from "@/lib/sheets";
import { canonicalUrl } from "@/lib/seo";

const DEFAULT_BIRTHDAY_URL = "https://birthdays.pixelpulseplay.ca/";
const DEFAULT_VR_URL =
  "https://pixelpulseplayzone.lilypadpos.app/public/onlinesales/tickets1.php?ptid=19";
const DEFAULT_WAGJAG_URL =
  "https://pixelpulseplayzone.lilypadpos.app/public/onlinesales/tickets1.php?ptid=18";
const BOOKING_SHEET = "booking";
const BARE_LILYPAD_TICKET_URL =
  "https://pixelpulseplayzone.lilypadpos.app/public/onlinesales/tickets1.php";

export const metadata = {
  title: "Book Your Visit | Pixel Pulse Play Zone Vaughan",
  description:
    "Choose how you want to book Pixel Pulse Play Zone: birthday parties, VR sessions, visit tickets, WagJag redemption, or Groupon redemption.",
  alternates: {
    canonical: canonicalUrl("/booking"),
  },
};

async function getBookingConfig() {
  try {
    const rows = await fetchsheetdata("config", LOCATION_NAME);
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.error("booking page config failed:", error);
    return [];
  }
}

async function getBookingRows() {
  try {
    const rows = await fetchsheetdata(BOOKING_SHEET, LOCATION_NAME);
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.error("booking cards sheet failed:", error);
    return [];
  }
}

function externalUrl(value = "", fallback = "") {
  const url = String(value || "").trim();
  if (url === BARE_LILYPAD_TICKET_URL) {
    return DEFAULT_VR_URL;
  }

  return url || fallback;
}

function parseVisibleFlag(value = "", fallback = true) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (!normalizedValue) return fallback;

  if (["true", "yes", "1", "show", "visible", "enabled", "on"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "no", "0", "hide", "hidden", "disabled", "off"].includes(normalizedValue)) {
    return false;
  }

  return fallback;
}

function isBookingCardVisible(config = [], type = "") {
  const keyName = type ? type.charAt(0).toUpperCase() + type.slice(1) : "";
  return parseVisibleFlag(
    getConfigValue(config, [
      `showBooking${keyName}Card`,
      `booking${keyName}CardVisible`,
      `show${keyName}BookingCard`,
    ]),
    true,
  );
}

function parseSortOrder(value = "", fallback = 100) {
  const parsed = Number.parseFloat(String(value || "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

const BOOKING_ICONS = {
  party: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 21h16v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8Z" />
      <path d="M4 15h16" />
      <path d="M9 11V7M12 11V7M15 11V7" />
      <path d="M12 2s-1.5 1.4-1.5 2.6A1.5 1.5 0 0 0 12 6a1.5 1.5 0 0 0 1.5-1.4C13.5 3.4 12 2 12 2Z" />
    </svg>
  ),
  vr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="2" y="7" width="20" height="11" rx="4" />
      <circle cx="8" cy="12.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12.5" r="1.6" fill="currentColor" stroke="none" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  ticket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M6 4h9l3 4-9 12L6 8Z" />
      <path d="M6 8h12M12 4v4" />
    </svg>
  ),
  coupon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z" />
      <path d="M10 5v14" strokeDasharray="2 2" />
    </svg>
  ),
};

function getFallbackUrls(config = []) {
  const birthdayUrl = externalUrl(
    getConfigValue(config, [
      "bookingPageBirthdayUrl",
      "bookingModalBirthdayPartyUrl",
      "bookingModalPartyUrl",
      "birthdayPartyBookingUrl",
      "lilypadpos_party",
    ]),
    DEFAULT_BIRTHDAY_URL,
  );
  const ticketUrl = externalUrl(
    getConfigValue(config, ["bookingPageTicketUrl", "lilypadpos_ticket"]),
    DEFAULT_VR_URL,
  );
  const vrUrl = externalUrl(
    getConfigValue(config, ["bookingPageVrUrl", "vrBookingUrl", "vrTicketUrl"]),
    DEFAULT_VR_URL,
  );
  const wagjagUrl = externalUrl(
    getConfigValue(config, ["bookingPageWagjagUrl", "wagjagRedeemUrl", "wagjagUrl"]),
    DEFAULT_WAGJAG_URL,
  );
  const grouponUrl = externalUrl(
    getConfigValue(config, ["bookingPageGrouponUrl", "grouponRedeemUrl", "grouponUrl"]),
    ticketUrl,
  );

  return {
    party: birthdayUrl,
    birthday: birthdayUrl,
    vr: vrUrl,
    ticket: ticketUrl,
    tickets: ticketUrl,
    wagjag: wagjagUrl,
    groupon: grouponUrl,
  };
}

function getFallbackBookingOptions(config = []) {
  const urls = getFallbackUrls(config);

  return [
    {
      type: "party",
      eyebrow: "Birthday Parties",
      title: "Book a Birthday Party",
      text: "Plan your party on the dedicated birthday booking site with date, package, and party details.",
      href: urls.party,
      cta: "Birthday Bookings",
      meta: "Birthday site",
      variant: "amber",
      iconKey: "party",
    },
    {
      type: "vr",
      eyebrow: "VR Adventure",
      title: "Book VR",
      text: "Reserve your VR session and step into the launch lineup.",
      href: urls.vr,
      cta: "Book VR",
      meta: "VR tickets",
      variant: "green",
      iconKey: "vr",
    },
    {
      type: "ticket",
      eyebrow: "General Visit",
      title: "Book Play Time",
      text: "Grab regular admission or visit tickets for Pixel Pulse Play Zone.",
      href: urls.ticket,
      cta: "Book Tickets",
      meta: "Live checkout",
      variant: "featured",
      iconKey: "ticket",
    },
    {
      type: "wagjag",
      eyebrow: "Coupon Redemption",
      title: "Redeem WagJag Code",
      text: "Use this option when you have a WagJag coupon or voucher code to redeem.",
      href: urls.wagjag,
      cta: "Redeem WagJag",
      meta: "Coupon code",
      variant: "ghost",
      iconKey: "coupon",
    },
    {
      type: "groupon",
      eyebrow: "Coupon Redemption",
      title: "Redeem Groupon Code",
      text: "Use this option when you have a Groupon coupon or voucher code to redeem.",
      href: urls.groupon,
      cta: "Redeem Groupon",
      meta: "Coupon code",
      variant: "ghost",
      iconKey: "coupon",
    },
  ];
}

function normalizeBookingType(value = "", fallback = "") {
  return String(value || fallback || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function bookingCardFromRow(row = {}, config = {}, index = 0) {
  const type = normalizeBookingType(
    getRowValue(row, ["type", "slug", "key", "cardType", "bookingType"]),
    `card-${index + 1}`,
  );
  const title = getRowValue(row, ["title", "cardTitle", "heading", "name"]);
  const href = externalUrl(
    getRowValue(row, ["ctaUrl", "lilypadUrl", "href", "url", "link", "bookingUrl", "ctaHref"]),
    config.urls[type] || "",
  );

  if (!type || !title || !href) {
    return null;
  }

  const iconKey = normalizeBookingType(
    getRowValue(row, ["icon", "iconKey", "iconType"]),
    type,
  );

  return {
    type,
    eyebrow: getRowValue(row, ["eyebrow", "label", "kicker", "category"]),
    title,
    text: getRowValue(row, ["text", "description", "body", "copy"]),
    href,
    cta: getRowValue(row, ["cta", "button", "buttonText", "ctaText"]) || "Book Now",
    meta: getRowValue(row, ["meta", "tag", "footer", "note"]),
    variant: normalizeBookingType(getRowValue(row, ["variant", "style", "theme"]), "green"),
    iconKey: BOOKING_ICONS[iconKey] ? iconKey : "ticket",
    order: parseSortOrder(getRowValue(row, ["sort", "order", "position", "rank"]), index + 1),
  };
}

function getSheetBookingOptions(rows = [], config = []) {
  const options = rows
    .map((row, index) => {
      const visible = parseVisibleFlag(
        getRowValue(row, ["isactive", "active", "show", "visible", "enabled"]),
        true,
      );

      if (!visible) return null;

      return bookingCardFromRow(row, { urls: getFallbackUrls(config) }, index);
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);

  return options;
}

function getBookingOptions(config = [], bookingRows = [], selectedType = "") {
  const sheetOptions = getSheetBookingOptions(bookingRows, config);
  const options = sheetOptions.length
    ? sheetOptions
    : getFallbackBookingOptions(config).filter((option) => isBookingCardVisible(config, option.type));

  if (!selectedType) return options;

  return [...options].sort((a, b) => {
    if (a.type === selectedType) return -1;
    if (b.type === selectedType) return 1;
    return 0;
  });
}

export default async function BookingPage({ searchParams }) {
  const [config, bookingRows] = await Promise.all([
    getBookingConfig(),
    getBookingRows(),
  ]);
  const selectedType = String(searchParams?.type || "").toLowerCase();
  const options = getBookingOptions(config, bookingRows, selectedType);

  return (
    <main className="ppp-booking-page">
      <div className="aero-max-container ppp-booking-wrap">
        <section className="ppp-booking-layout" aria-label="Booking options">
          <div className="ppp-booking-section-intro">
            <h2>What would you like to book?</h2>
            <p>Select a card to load the booking page below.</p>
          </div>

          <BookingChooser options={options} selectedType={selectedType} />

          <div className="ppp-booking-help">
            <p>Not sure which option to choose?</p>
            <Link href="/contactus">Contact us</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
