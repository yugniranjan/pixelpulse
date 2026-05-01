import Image from "next/image";
import Link from "next/link";
import "../styles/squad.css";
import SquadSignupForm from "@/components/SquadSignupForm";
import { fetchsheetdata } from "@/lib/sheets";
import { getConfiguredValue } from "@/lib/ctaContent";

const siteUrl = process.env.SITE_URL || "https://www.pixelpulseplay.ca";
const LOCATION_SLUG = "vaughan";
const SQUAD_SHEET = "squadlanding";
const FALLBACK_HERO_IMAGE = "/assets/images/floorchallenge.jpg";
const FALLBACK_MAIN_LOGO = "/assets/images/logoD.png";
const FALLBACK_BOOKING_LOGO = "/assets/images/logo.png";

const fallbackRewardTiers = [
  { count: "5 friends", reward: "Arcade credits" },
  { count: "10 friends", reward: "Free 60-minute play pass" },
  { count: "20 friends", reward: "VIP access" },
];

const fallbackTerms = [
  "Squad members are encouraged to participate regularly in arcade events, challenges, tournaments, and community activities to maintain active membership.",
  "Members must follow all game rules and practice fair play. Exploits, unauthorized hacks, or unsportsmanlike conduct are prohibited.",
  "Squad benefits, rewards, and promotions are subject to availability and may be modified or discontinued by Pixel Pulse Arcade at any time.",
];

const fallbackInfoCards = [
  {
    title: "What you do?",
    items: [
      "Bring your friends",
      "Earn free game passes and arcade credits",
      "Compete on leaderboards",
    ],
  },
  {
    title: "What you get?",
    rewards: fallbackRewardTiers,
  },
  {
    kicker: "Parent-friendly",
    title: "Built for players.",
    items: [
      "Ages 11-17",
      "Safe and supervised",
      "No cost, no obligation",
      "Reward-based, no cash payouts",
    ],
  },
];

async function getSquadLandingData() {
  try {
    return await fetchsheetdata(SQUAD_SHEET, LOCATION_SLUG);
  } catch (error) {
    console.error("squad landing sheet failed:", error);
    return [];
  }
}

function parseJsonValue(rows = [], keys = [], fallback) {
  const raw = getConfiguredValue(rows, keys, "");
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(
      raw
        .replace(/<br\/>/g, "")
        .replace(/\n/g, "")
        .replace(/,\s*([}\]])/g, "$1")
        .trim(),
    );
    return parsed || fallback;
  } catch (error) {
    console.error(`squad landing JSON parse failed for ${keys.join(", ")}:`, error);
    return fallback;
  }
}

function getTextList(rows = [], keys = [], fallback = []) {
  const parsed = parseJsonValue(rows, keys, null);
  if (Array.isArray(parsed)) {
    return parsed.map((item) => String(item || "").trim()).filter(Boolean);
  }

  const raw = getConfiguredValue(rows, keys, "");
  if (!raw) return fallback;

  return raw
    .split(/\n|<br\/>|\|/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRewardTiers(rows = []) {
  const parsed = parseJsonValue(rows, ["squadRewards", "rewards"], null);
  return Array.isArray(parsed) && parsed.length ? parsed : fallbackRewardTiers;
}

function getInfoCards(rows = [], rewardTiers = fallbackRewardTiers) {
  const parsed = parseJsonValue(rows, ["squadInfoCards", "infoCards"], null);
  if (Array.isArray(parsed) && parsed.length) return parsed;

  const whatYouDo = getTextList(rows, ["squadWhatYouDoItems", "whatYouDoItems"], fallbackInfoCards[0].items);
  const parentItems = getTextList(rows, ["squadParentItems", "parentItems"], fallbackInfoCards[2].items);

  return [
    {
      title: getConfiguredValue(rows, ["squadWhatYouDoTitle", "whatYouDoTitle"], fallbackInfoCards[0].title),
      items: whatYouDo,
    },
    {
      title: getConfiguredValue(rows, ["squadWhatYouGetTitle", "whatYouGetTitle"], fallbackInfoCards[1].title),
      rewards: rewardTiers,
    },
    {
      kicker: getConfiguredValue(rows, ["squadParentKicker", "parentKicker"], fallbackInfoCards[2].kicker),
      title: getConfiguredValue(rows, ["squadParentTitle", "parentTitle"], fallbackInfoCards[2].title),
      items: parentItems,
    },
  ];
}

function localOrRemoteImage(value = "", fallback = "") {
  const image = String(value || "").trim();
  if (!image) return fallback;
  return image.startsWith("http") || image.startsWith("/") ? image : `/${image}`;
}

function absoluteUrl(value = "") {
  const url = String(value || "").trim();
  if (!url) return "";
  return url.startsWith("http") ? url : `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

function getSquadContent(rows = []) {
  const rewardTiers = getRewardTiers(rows);
  const terms = getTextList(rows, ["squadTerms", "terms"], fallbackTerms);

  return {
    metaTitle: getConfiguredValue(rows, ["squadMetaTitle", "metaTitle"], "Pixel Pulse Squad | Bring Friends, Play, Earn Rewards"),
    metaDescription: getConfiguredValue(
      rows,
      ["squadMetaDescription", "metaDescription"],
      "Join the Pixel Pulse Squad in Vaughan. Bring friends, play arcade challenges, earn rewards, and compete on leaderboards in a safe supervised program for ages 11-17.",
    ),
    canonical: getConfiguredValue(rows, ["squadCanonical", "canonical"], `${siteUrl}/squad`),
    ogImage: absoluteUrl(localOrRemoteImage(getConfiguredValue(rows, ["squadOgImage", "ogImage"], "/assets/images/arcade.JPG"), "/assets/images/arcade.JPG")),
    mainLogo: localOrRemoteImage(getConfiguredValue(rows, ["squadMainLogo", "mainLogo"], FALLBACK_MAIN_LOGO), FALLBACK_MAIN_LOGO),
    mainLogoAlt: getConfiguredValue(rows, ["squadMainLogoAlt", "mainLogoAlt"], "Pixel Pulse Play n Party"),
    emblemTop: getConfiguredValue(rows, ["squadEmblemTop", "emblemTop"], "Pixel"),
    emblemMiddle: getConfiguredValue(rows, ["squadEmblemMiddle", "emblemMiddle"], "Pulse"),
    emblemBottom: getConfiguredValue(rows, ["squadEmblemBottom", "emblemBottom"], "Squad"),
    heroKicker: getConfiguredValue(rows, ["squadHeroKicker", "heroKicker"], "Ages 11-17 | Safe and supervised"),
    heroTitle: getConfiguredValue(rows, ["squadHeroTitle", "heroTitle"], "Join the Pixel Pulse Squad Today!"),
    heroSubtitle: getConfiguredValue(rows, ["squadHeroSubtitle", "heroSubtitle"], "Bring your friends. Play. Earn rewards."),
    heroImage: localOrRemoteImage(getConfiguredValue(rows, ["squadHeroImage", "heroImage"], FALLBACK_HERO_IMAGE), FALLBACK_HERO_IMAGE),
    heroImageAlt: getConfiguredValue(rows, ["squadHeroImageAlt", "heroImageAlt"], "Players inside the Pixel Pulse floor challenge room"),
    rewardTiers,
    infoCards: getInfoCards(rows, rewardTiers),
    bookingLogo: localOrRemoteImage(getConfiguredValue(rows, ["squadBookingLogo", "bookingLogo"], FALLBACK_BOOKING_LOGO), FALLBACK_BOOKING_LOGO),
    bookingLogoAlt: getConfiguredValue(rows, ["squadBookingLogoAlt", "bookingLogoAlt"], "Pixel Pulse Play"),
    bookingText: getConfiguredValue(rows, ["squadBookingText", "bookingText"], "Pixel Pulse Playzone - Vaughan"),
    bookingTitle: getConfiguredValue(rows, ["squadBookingTitle", "bookingTitle"], "Ask your parent to sign up today."),
    bookingButtonText: getConfiguredValue(rows, ["squadBookingButtonText", "bookingButtonText"], "Book Today"),
    website: getConfiguredValue(rows, ["squadWebsite", "website"], "www.pixelpulseplay.ca"),
    phone: getConfiguredValue(rows, ["squadPhone", "phone"], "905-760-2922"),
    email: getConfiguredValue(rows, ["squadEmail", "email"], "connect@pixelpulsplay.ca"),
    address: getConfiguredValue(rows, ["squadAddress", "address"], "960 Edgeley Blvd, Vaughan Mills"),
    termsTitle: getConfiguredValue(rows, ["squadTermsTitle", "termsTitle"], "Terms and Conditions"),
    terms,
    form: {
      eyebrow: getConfiguredValue(rows, ["squadFormEyebrow", "formEyebrow"], "Parent sign-up"),
      title: getConfiguredValue(rows, ["squadFormTitle", "formTitle"], "Join the Squad"),
      childNameLabel: getConfiguredValue(rows, ["squadFormChildNameLabel", "formChildNameLabel"], "Child name"),
      ageLabel: getConfiguredValue(rows, ["squadFormAgeLabel", "formAgeLabel"], "Age"),
      guardianNameLabel: getConfiguredValue(rows, ["squadFormGuardianNameLabel", "formGuardianNameLabel"], "Parent/guardian name"),
      phoneLabel: getConfiguredValue(rows, ["squadFormPhoneLabel", "formPhoneLabel"], "Phone"),
      emailLabel: getConfiguredValue(rows, ["squadFormEmailLabel", "formEmailLabel"], "Email"),
      notesLabel: getConfiguredValue(rows, ["squadFormNotesLabel", "formNotesLabel"], "Notes"),
      notesPlaceholder: getConfiguredValue(rows, ["squadFormNotesPlaceholder", "formNotesPlaceholder"], "Questions, preferred visit day, or squad goals"),
      permissionText: getConfiguredValue(rows, ["squadFormPermissionText", "formPermissionText"], "I give permission for my child to participate in the Pixel Pulse Squad program."),
      termsText: getConfiguredValue(rows, ["squadFormTermsText", "formTermsText"], "I understand this is a voluntary, reward-based program with no cash compensation."),
      submitText: getConfiguredValue(rows, ["squadFormSubmitText", "formSubmitText"], "Send Squad Request"),
      helperText: getConfiguredValue(rows, ["squadFormHelperText", "formHelperText"], "A Pixel Pulse team member will follow up with next steps."),
      sendingText: getConfiguredValue(rows, ["squadFormSendingText", "formSendingText"], "Sending your Squad request..."),
      successText: getConfiguredValue(rows, ["squadFormSuccessText", "formSuccessText"], "Thanks. We received your Pixel Pulse Squad request."),
      errorText: getConfiguredValue(rows, ["squadFormErrorText", "formErrorText"], "We could not send this request. Please try again."),
      selectedEvent: getConfiguredValue(rows, ["squadFormSelectedEvent", "formSelectedEvent"], "Pixel Pulse Squad"),
      source: getConfiguredValue(rows, ["squadFormSource", "formSource"], "pixel-pulse-squad"),
    },
  };
}

export async function generateMetadata() {
  const rows = await getSquadLandingData();
  const content = getSquadContent(rows);

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: {
      canonical: content.canonical,
    },
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      url: content.canonical,
      images: [
        {
          url: content.ogImage,
          width: 1200,
          height: 630,
          alt: content.heroImageAlt,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: content.metaTitle,
      description: content.metaDescription,
      images: [content.ogImage],
    },
  };
}

export default async function SquadLandingPage() {
  const rows = await getSquadLandingData();
  const content = getSquadContent(rows);

  return (
    <main className="ppp-squad-page">
      <section className="ppp-squad-hero" aria-labelledby="squad-title">
        <div className="ppp-squad-light ppp-squad-light--left" aria-hidden="true" />
        <div className="ppp-squad-light ppp-squad-light--right" aria-hidden="true" />
        <div className="ppp-squad-led-strips" aria-hidden="true">
          <span className="ppp-squad-led-strip ppp-squad-led-strip--top" />
          <span className="ppp-squad-led-strip ppp-squad-led-strip--mid" />
          <span className="ppp-squad-led-strip ppp-squad-led-strip--bottom" />
        </div>
        <div className="ppp-squad-shell ppp-squad-hero__inner">
          <div className="ppp-squad-brand-row">
            <Image
              src={content.mainLogo}
              alt={content.mainLogoAlt}
              width={270}
              height={106}
              priority
              className="ppp-squad-main-logo"
            />
            <div className="ppp-squad-emblem" aria-label="Pixel Pulse Squad">
              <span>{content.emblemTop}</span>
              <strong>{content.emblemMiddle}</strong>
              <small>{content.emblemBottom}</small>
            </div>
          </div>

          <div className="ppp-squad-hero__copy">
            <p className="ppp-squad-kicker">{content.heroKicker}</p>
            <h1 id="squad-title">{content.heroTitle}</h1>
            <p>{content.heroSubtitle}</p>
          </div>

          <div className="ppp-squad-hero__grid">
            <div className="ppp-squad-hero__content">
              <div className="ppp-squad-stage">
                <div className="ppp-squad-frame">
                  <Image
                    src={content.heroImage}
                    alt={content.heroImageAlt}
                    width={980}
                    height={620}
                    priority
                  />
                </div>
              </div>
            </div>

            <SquadSignupForm content={content.form} />
          </div>
        </div>
      </section>

      <section className="ppp-squad-info">
        <div className="ppp-squad-shell ppp-squad-info__grid">
          {content.infoCards.map((card, index) => (
            <article key={card.title || card.kicker || index}>
              {card.kicker ? <p className="ppp-squad-kicker">{card.kicker}</p> : null}
              {card.title ? <h2>{card.title}</h2> : null}
              {Array.isArray(card.rewards) && card.rewards.length ? (
                <div className="ppp-squad-rewards">
                  {card.rewards.map((tier) => (
                    <div key={`${tier.count || tier.value}-${tier.reward || tier.text}`}>
                      <strong>{tier.count || tier.value}</strong>
                      <span>{tier.reward || tier.text}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {Array.isArray(card.items) && card.items.length ? (
                <ul>
                  {card.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="ppp-squad-parent">
        <div className="ppp-squad-shell ppp-squad-parent__grid">
          <div className="ppp-squad-booking-panel">
            <Image
              src={content.bookingLogo}
              alt={content.bookingLogoAlt}
              width={120}
              height={120}
            />
            <p>{content.bookingText}</p>
            <h3>{content.bookingTitle}</h3>
            <Link href="#squad-signup">{content.bookingButtonText}</Link>
          </div>
        </div>
      </section>

      <section className="ppp-squad-signup-section">
        <div className="ppp-squad-shell ppp-squad-signup__grid">
          <div className="ppp-squad-contact-card">
            <span>{content.website}</span>
            <strong>{content.phone}</strong>
            <span>{content.email}</span>
            <p>{content.address}</p>
          </div>
        </div>
      </section>

      <section className="ppp-squad-terms">
        <div className="ppp-squad-shell">
          <h2>{content.termsTitle}</h2>
          <ol>
            {content.terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
