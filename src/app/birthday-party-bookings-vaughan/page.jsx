import Image from "next/image";
import "../styles/birthday-landing.css";
import "../styles/birthday-bookings-vaughan.css";
import BirthdayHeroContactForm from "@/components/BirthdayHeroContactForm";
import BookingButton from "@/components/smallComponents/BookingButton";

const heroImage = "https://storage.googleapis.com/pixel-pulse-play/web/birthdaylandinghero.webp";
const arenaImage = "https://storage.googleapis.com/pixel-pulse-play/web/PrivateParty.png";
const localArcadeImage = "/assets/images/arcade.JPG";
const localFloorImage = "/assets/images/floorchallenge.jpg";
const localShootingImage = "/assets/images/shootinggame.jpg";
const phoneUrl = "tel:+19057602922";
const pageUrl = "https://parties.pixelpulseplay.ca";

export const metadata = {
  title: "Kids & Teens Birthday Party Bookings Vaughan | Pixel Pulse Play",
  description:
    "Book a kids or teens birthday party in Vaughan at Pixel Pulse Play, an interactive gaming arena with challenge rooms, live scores, party hosts, and active group play.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Kids & Teens Birthday Party Bookings Vaughan | Pixel Pulse Play",
    description:
      "A birthday party in Vaughan built around interactive gaming, challenge rooms, live leaderboards, and hosted group energy for kids and teens.",
    url: pageUrl,
    images: [
      {
        url: heroImage,
        width: 1200,
        height: 630,
        alt: "Birthday party bookings at Pixel Pulse Play Vaughan",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kids & Teens Birthday Party Bookings Vaughan | Pixel Pulse Play",
    description:
      "Interactive birthday party bookings for kids and teens in Vaughan.",
    images: [heroImage],
  },
};

const navLinks = [
  { label: "Why Pixel Pulse", href: "#positioning" },
  { label: "Age Fit", href: "#age-fit" },
  { label: "Packages", href: "#packages" },
  { label: "FAQ", href: "#faq" },
];

const heroStats = [
  { value: "Kids", label: "active party games" },
  { value: "Teens", label: "competitive challenges" },
  { value: "Vaughan", label: "indoor party arena" },
];

const positioningPoints = [
  {
    title: "Interactive gaming, not passive screen time",
    text: "Guests move through physical game rooms where timing, memory, aim, speed, balance, and teamwork all matter.",
  },
  {
    title: "Built for birthday groups",
    text: "The party flow gives kids and teens enough structure to stay together, with enough variety to keep every guest engaged.",
  },
  {
    title: "Leaderboard energy",
    text: "Scores turn the celebration into a friendly competition, so the group gets moments to cheer, replay, and compare wins.",
  },
];

const ageBands = [
  {
    age: "Kids",
    range: "7-12",
    title: "Easy to jump in",
    text: "Fast instructions, active rooms, and host guidance help younger players feel confident quickly.",
  },
  {
    age: "Tweens",
    range: "10-13",
    title: "Enough challenge to matter",
    text: "Puzzle, reflex, and movement games give friend groups a party that feels more grown up than a play place.",
  },
  {
    age: "Teens",
    range: "13+",
    title: "Competitive and social",
    text: "High-score chasing, team rotations, and live results make the party feel like a real gaming event.",
  },
];

const experienceTiles = [
  {
    title: "Challenge Rooms",
    text: "Rotate through interactive rooms made for movement, reaction time, and group competition.",
    image: localFloorImage,
  },
  {
    title: "Target Games",
    text: "Aim, score, and replay. Great for mixed ages because everyone understands the goal fast.",
    image: localShootingImage,
  },
  {
    title: "Arcade Energy",
    text: "Classic arcade fun supports the main party flow and gives guests more ways to stay engaged.",
    image: localArcadeImage,
  },
];

const partyFlow = [
  ["01", "Arrive", "Guests check in, meet the host, and get ready for the party flow."],
  ["02", "Play", "The group rotates through interactive games and challenge rooms."],
  ["03", "Compete", "Scores, rematches, and team moments keep the room buzzing."],
  ["04", "Celebrate", "Wrap with food, cake, photos, and a winner-worthy finish."],
];

const packages = [
  {
    name: "Kids Birthday",
    label: "Most flexible",
    text: "A hosted party for younger groups that need clear flow, easy rotations, and room to celebrate.",
    includes: ["Game time", "Party host", "Party area", "Waiver support"],
  },
  {
    name: "Teen Challenge Party",
    label: "Best for competition",
    text: "A higher-energy party built around scores, rematches, team play, and bragging rights.",
    includes: ["Live leaderboard", "Challenge rooms", "Arcade time", "Group rotations"],
  },
  {
    name: "Private Arena Party",
    label: "Big moment",
    text: "A stronger option for larger birthday groups that want more control over the arena experience.",
    includes: ["Private event flow", "Dedicated host", "Custom timing", "Group scoring"],
  },
];

const faqs = [
  {
    question: "Is Pixel Pulse Play better for kids or teens?",
    answer:
      "Both. Younger kids like the movement and quick games, while teens usually lock into the competitive scoring and challenge-room format.",
  },
  {
    question: "Where is the birthday party venue?",
    answer:
      "Pixel Pulse Play is in Vaughan, serving families from Vaughan, Woodbridge, Maple, Concord, and nearby areas.",
  },
  {
    question: "Can parents request a callback before booking?",
    answer:
      "Yes. Use the party request form and the team can help with date availability, group size, and package fit.",
  },
  {
    question: "Do guests need waivers?",
    answer:
      "Yes. Sending the waiver link before the party helps make check-in faster on the day of the event.",
  },
];

export default function BirthdayPartyBookingsVaughanPage() {
  return (
    <main className="ppp-bday-booking-page">
      <nav className="ppp-bday-booking-nav" aria-label="Birthday party page navigation">
        <a className="ppp-bday-booking-logo" href="/">
          <Image src="/assets/images/logoD.png" alt="Pixel Pulse Play" width={188} height={70} priority />
        </a>
        <div>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
        <a className="ppp-bday-nav-phone" href={phoneUrl}>
          Call +1 (905) 760-2922
        </a>
      </nav>

      <section className="ppp-bday-booking-hero">
        <Image
          className="ppp-bday-booking-hero__image"
          src={heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
        />
        <div className="ppp-bday-booking-shell ppp-bday-booking-hero__layout">
          <div className="ppp-bday-booking-hero__copy">
            <p className="ppp-bday-kicker">Birthday party bookings in Vaughan</p>
            <h1>Kids and teens birthday parties powered by interactive gaming.</h1>
            <p>
              Pixel Pulse Play positions the birthday party as a live gaming arena:
              active challenge rooms, friendly competition, real scores, and a host-led
              flow that keeps the group moving.
            </p>
            <div className="ppp-bday-booking-actions">
              <BookingButton title="Book a birthday party" bookingType="party" />
              <a href="#birthday-party-form">Request a callback</a>
            </div>
            <div className="ppp-bday-hero-stats" aria-label="Birthday party audience">
              {heroStats.map((item) => (
                <div key={item.value}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <BirthdayHeroContactForm urgency="Weekend birthday slots can fill quickly. Ask about availability for your preferred date." />
        </div>
      </section>

      <section className="ppp-bday-booking-section ppp-bday-booking-section--packages" id="packages">
        <div className="ppp-bday-booking-shell">
          <div className="ppp-bday-section-heading ppp-bday-section-heading--center">
            <p>Booking options</p>
            <h2>Choose the birthday format that fits your group.</h2>
          </div>
          <div className="ppp-bday-package-grid">
            {packages.map((pkg) => (
              <article key={pkg.name}>
                <p>{pkg.label}</p>
                <h3>{pkg.name}</h3>
                <span>{pkg.text}</span>
                <ul>
                  {pkg.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-bday-booking-section" id="positioning">
        <div className="ppp-bday-booking-shell ppp-bday-positioning">
          <div className="ppp-bday-section-heading">
            <p>Pixel Pulse positioning</p>
            <h2>A birthday party that feels like stepping inside the game.</h2>
          </div>
          <div className="ppp-bday-positioning__grid">
            {positioningPoints.map((point) => (
              <article key={point.title}>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-bday-booking-section ppp-bday-booking-section--light" id="age-fit">
        <div className="ppp-bday-booking-shell">
          <div className="ppp-bday-section-heading ppp-bday-section-heading--wide">
            <p>Age fit</p>
            <h2>One Vaughan venue, different wins for kids, tweens, and teens.</h2>
          </div>
          <div className="ppp-bday-age-grid">
            {ageBands.map((band) => (
              <article key={band.age}>
                <span>{band.range}</span>
                <h3>{band.age}</h3>
                <strong>{band.title}</strong>
                <p>{band.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-bday-booking-section">
        <div className="ppp-bday-booking-shell">
          <div className="ppp-bday-section-heading">
            <p>Interactive gaming mix</p>
            <h2>Active play, arcade moments, and score-chasing in one party.</h2>
          </div>
          <div className="ppp-bday-experience-grid">
            {experienceTiles.map((item) => (
              <article key={item.title}>
                <Image src={item.image} alt="" width={720} height={520} sizes="(max-width: 900px) 100vw, 33vw" />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-bday-booking-section ppp-bday-booking-section--arena">
        <Image src={arenaImage} alt="" fill sizes="100vw" />
        <div className="ppp-bday-booking-shell ppp-bday-flow-layout">
          <div className="ppp-bday-section-heading">
            <p>Party flow</p>
            <h2>Simple for parents and electric for the guests.</h2>
          </div>
          <div className="ppp-bday-flow">
            {partyFlow.map(([number, title, text]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-bday-booking-section ppp-bday-booking-section--light" id="faq">
        <div className="ppp-bday-booking-shell ppp-bday-faq-layout">
          <div className="ppp-bday-section-heading">
            <p>Booking questions</p>
            <h2>Before you pick the date.</h2>
          </div>
          <div className="ppp-bday-faq">
            {faqs.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-bday-final">
        <div className="ppp-bday-booking-shell ppp-bday-final__inner">
          <div>
            <p>Pixel Pulse Play Vaughan</p>
            <h2>Ready to book a birthday party they will talk about after the scores reset?</h2>
          </div>
          <div className="ppp-bday-final__actions">
            <BookingButton title="Book birthday party" bookingType="party" />
            <a href={phoneUrl}>Call the team</a>
          </div>
        </div>
      </section>
    </main>
  );
}
