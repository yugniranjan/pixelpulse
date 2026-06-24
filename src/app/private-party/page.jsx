import Image from "next/image";
import "../styles/private-party.css";
import { canonicalUrl } from "@/lib/seo";

const logo = "/assets/images/logoD.png";
const heroImage = "https://storage.googleapis.com/pixel-pulse-play/web/PrivateParty.webp";
const arenaImage = "https://storage.googleapis.com/pixel-pulse-play/web/birthdaylandinghero.webp";
const contactUrl = "/contactus";
const phoneUrl = "tel:+19057602922";

export const metadata = {
  title: "Private Party | Pixel Pulse Play Vaughan",
  description:
    "Plan a private party at Pixel Pulse Play Vaughan with interactive challenge rooms, live leaderboards, dedicated hosts, and group packages for birthdays, teams, families, and celebrations.",
  alternates: {
    canonical: canonicalUrl("/private-party"),
  },
  openGraph: {
    title: "Private Party | Pixel Pulse Play Vaughan",
    description:
      "Host a high-energy private party at Pixel Pulse Play with challenge rooms, arena-style gameplay, and a dedicated event flow for your group.",
    url: canonicalUrl("/private-party"),
    images: [
      {
        url: heroImage,
        width: 1200,
        height: 630,
        alt: "Private party at Pixel Pulse Play Vaughan",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Private Party | Pixel Pulse Play Vaughan",
    description:
      "Private parties, challenge rooms, live leaderboards, and dedicated hosts at Pixel Pulse Play Vaughan.",
    images: [heroImage],
  },
  robots: {
    index: true,
  },
};

const navLinks = [
  { label: "Attractions", href: "/attractions" },
  { label: "Birthday", href: "/kids-birthday-parties" },
  { label: "Groups", href: "/group-events" },
  { label: "Pricing", href: "/pricing-promos" },
];

const heroStats = [
  { value: "12+", label: "Challenge Rooms" },
  { value: "10-100", label: "Guest Capacity" },
  { value: "2hr", label: "Private Slots" },
  { value: "Live", label: "Group Scores" },
];

const steps = [
  {
    number: "01",
    title: "Inquire & Customize",
    body: "Tell us your group size, date, and celebration style. We shape the event flow around your crew.",
  },
  {
    number: "02",
    title: "Confirm & Lock In",
    body: "We reserve the time slot, prepare your party zone, and plan the leaderboard setup.",
  },
  {
    number: "03",
    title: "Show Up & Compete",
    body: "Guests check in, get briefed, and jump into challenge rooms built for real group energy.",
  },
  {
    number: "04",
    title: "Crown the Champion",
    body: "Live scores, final rankings, and bragging rights give the party a finish everyone remembers.",
  },
];

const attractions = [
  ["Laser Maze", "Agility and timing"],
  ["Hexa Quest", "Puzzle and reflex"],
  ["Edge Climb", "Climb and balance"],
  ["Shoot It Out", "Target action"],
  ["Tile Hunt", "Speed and memory"],
  ["T-Rex Heist", "Adventure mission"],
  ["Soccer Challenge", "Sports accuracy"],
  ["Basket Ball", "Arcade scoring"],
  ["Maze Gate", "Movement puzzle"],
  ["Pizza Delivery", "Reaction quest"],
  ["Ball Toss", "Aim challenge"],
  ["Seashells", "Search and score"],
];

const packages = [
  {
    name: "Pulse Party",
    sub: "A focused party setup for smaller squads who want the Pixel Pulse experience.",
    price: "$299",
    note: "Starting from",
    features: [
      "Up to 15 guests",
      "60-minute play session",
      "Dedicated party area",
      "Live leaderboard for your group",
      "Party host on site",
    ],
    muted: ["Full arena buyout", "Custom tournament bracket"],
  },
  {
    name: "Arena Takeover",
    sub: "The full private-party energy with more time, more rooms, and more competition.",
    price: "$599",
    note: "Starting from",
    badge: "Most Popular",
    featured: true,
    features: [
      "Up to 40 guests",
      "90-minute private session",
      "Full arena access",
      "Live tournament leaderboard",
      "Dedicated party host",
      "Food and drink options available",
      "Custom bracket and scoring",
    ],
    muted: ["VIP lounge add-on"],
  },
  {
    name: "Ultimate VIP",
    sub: "A larger private event with more control, more support, and a fully custom flow.",
    price: "$999",
    note: "Starting from",
    features: [
      "Up to 100 guests",
      "2-hour private session",
      "Full arena exclusively yours",
      "Custom branded leaderboard",
      "Two dedicated hosts",
      "Catering options",
      "Tournament design",
    ],
    muted: [],
  },
];

const reasons = [
  {
    title: "Brain + Body Gameplay",
    body: "Guests think, react, move, aim, climb, and chase scores across rooms that feel active from the first minute.",
  },
  {
    title: "Live Group Leaderboard",
    body: "Your party gets real-time rankings so everyone can see who is climbing, falling, and staging a comeback.",
  },
  {
    title: "Zero Setup Stress",
    body: "A dedicated host keeps the flow moving while you enjoy the party instead of managing every detail.",
  },
  {
    title: "Replay Value Built In",
    body: "Different rooms, different scores, and rematch energy make the experience feel fresh for every guest.",
  },
];

const leaderboardRows = [
  ["1", "Alex K.", "Laser Maze", "9,850", "0:45"],
  ["2", "Jordan M.", "T-Rex Heist", "9,200", "1:02"],
  ["3", "Sam R.", "Tile Hunt", "8,750", "0:58"],
  ["4", "Taylor W.", "Soccer Challenge", "8,400", "0:50"],
  ["5", "Morgan L.", "Shoot It Out", "8,100", "0:55"],
];

const testimonials = [
  {
    quote:
      "We booked for my son's birthday and the kids were locked into the leaderboard the whole time. Staff handled the flow and we actually got to enjoy it.",
    name: "Sarah M.",
    role: "Parent, Vaughan",
  },
  {
    quote:
      "Our team event had instant energy. Even the quiet people were competing, laughing, and checking scores between every room.",
    name: "Aisha K.",
    role: "Group organizer, Maple",
  },
  {
    quote:
      "It felt private, organized, and exciting without us needing to build the party from scratch. The kids are already asking for a rematch.",
    name: "James T.",
    role: "Parent, Woodbridge",
  },
];

const faqs = [
  {
    q: "How far in advance should I book?",
    a: "We recommend 2-3 weeks in advance, especially for weekend private-party slots. Earlier inquiries give us more room to match your preferred time.",
  },
  {
    q: "What group sizes work best?",
    a: "Private parties work well for groups of 10 or more, and larger events can be planned for up to 100 guests depending on the package and timing.",
  },
  {
    q: "Can we bring cake or decorations?",
    a: "Yes, you can bring a cake and simple decorations for your party area. Ask us about food, drink, and timing options when you inquire.",
  },
  {
    q: "Can the leaderboard be customized?",
    a: "Yes. Private parties can use a group leaderboard, and larger packages can include custom tournament-style scoring.",
  },
  {
    q: "Are the challenges good for different ages?",
    a: "Most rooms are designed for kids, teens, families, and adults. Our team helps guide guests toward age-appropriate challenges during the session.",
  },
  {
    q: "Do guests need a waiver?",
    a: "Yes, all participating guests need a signed waiver before play. Sending the waiver link before the event helps speed up check-in.",
  },
];

export default function PrivatePartyPage() {
  return (
    <main className="ppp-private-page">
      <nav className="ppp-private-nav" aria-label="Private party landing navigation">
        <a className="ppp-private-logo" href="/">
          <Image src={logo} alt="Pixel Pulse Play" width={190} height={64} priority />
        </a>
        <div className="ppp-private-nav__links">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <a className="ppp-private-nav__cta" href={contactUrl}>
            Inquire Now
          </a>
        </div>
      </nav>

      <section className="ppp-private-hero">
        <Image
          className="ppp-private-hero__image"
          src={heroImage}
          alt=""
          fill
          sizes="100vw"
          priority
        />
        <div className="ppp-private-hero__grid" />
        <div className="ppp-private-shell ppp-private-hero__layout">
          <div className="ppp-private-hero__copy">
            <p className="ppp-private-kicker">Private Party | Vaughan</p>
            <h1>
              High-Energy <span>Celebrations</span> Without The Chaos.
            </h1>
            <p className="ppp-private-hero__text">
              Rent the entire arena, or build a dedicated party experience for your group.
              Pixel Pulse Play turns birthdays, team nights, family events, and friend
              hangouts into a real challenge-room celebration.
            </p>
            <div className="ppp-private-actions">
              <a className="ppp-private-btn ppp-private-btn--primary" href={contactUrl}>
                Inquire About A Party
              </a>
              <a className="ppp-private-btn ppp-private-btn--ghost" href="#packages">
                View Packages
              </a>
            </div>
          </div>

          <aside className="ppp-private-hero-card" aria-label="Private party highlights">
            <p>Why Groups Love Us</p>
            <h2>Your Group. Your Rules.</h2>
            <span>
              Dedicated hosts, arena-style gameplay, and a leaderboard with your crew&apos;s
              names on it.
            </span>
            <div className="ppp-private-stats">
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <small>{stat.label}</small>
                </div>
              ))}
            </div>
            <a className="ppp-private-btn ppp-private-btn--primary" href={contactUrl}>
              Check Availability
            </a>
          </aside>
        </div>
      </section>

      <section className="ppp-private-section ppp-private-section--panel">
        <div className="ppp-private-shell">
          <div className="ppp-private-section__header">
            <p>The Process</p>
            <h2>Booked. Played. Legendary.</h2>
          </div>
          <div className="ppp-private-steps">
            {steps.map((step) => (
              <article className="ppp-private-step" key={step.number}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-private-section">
        <div className="ppp-private-shell ppp-private-split">
          <div>
            <div className="ppp-private-section__header">
              <p>All Included</p>
              <h2>12 Challenge Rooms. One Private Arena.</h2>
            </div>
            <p className="ppp-private-muted">
              Every private party can tap into the full attraction lineup, from fast
              reflex games to team missions and score-chasing rooms.
            </p>
          </div>
          <div className="ppp-private-attractions">
            {attractions.map(([name, meta]) => (
              <article key={name}>
                <strong>{name}</strong>
                <span>{meta}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-private-section ppp-private-section--panel" id="packages">
        <div className="ppp-private-shell">
          <div className="ppp-private-section__header ppp-private-section__header--center">
            <p>Party Packages</p>
            <h2>Pick Your Level Of Legendary.</h2>
          </div>
          <div className="ppp-private-packages">
            {packages.map((pkg) => (
              <article
                className={`ppp-private-package${pkg.featured ? " ppp-private-package--featured" : ""}`}
                key={pkg.name}
              >
                {pkg.badge ? <span className="ppp-private-package__badge">{pkg.badge}</span> : null}
                <h3>{pkg.name}</h3>
                <p>{pkg.sub}</p>
                <div className="ppp-private-price">
                  <span>{pkg.note}</span>
                  <strong>{pkg.price}</strong>
                  <small>/ event</small>
                </div>
                <ul>
                  {pkg.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                  {pkg.muted.map((feature) => (
                    <li className="is-muted" key={feature}>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  className={`ppp-private-package__cta${pkg.featured ? " is-solid" : ""}`}
                  href={contactUrl}
                >
                  Inquire
                </a>
              </article>
            ))}
          </div>
          <p className="ppp-private-note">
            Prices are starting estimates. Final pricing depends on group size, date,
            private access, and add-ons.
          </p>
        </div>
      </section>

      <section className="ppp-private-section">
        <div className="ppp-private-shell ppp-private-experience">
          <div>
            <div className="ppp-private-section__header">
              <p>Why Pixel Pulse</p>
              <h2>
                Not Just A Venue. <span>A Victory Lap.</span>
              </h2>
            </div>
            <div className="ppp-private-reasons">
              {reasons.map((reason) => (
                <article key={reason.title}>
                  <h3>{reason.title}</h3>
                  <p>{reason.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="ppp-private-leaderboard">
            <Image
              src={arenaImage}
              alt=""
              width={680}
              height={420}
              sizes="(max-width: 900px) 100vw, 44vw"
            />
            <div className="ppp-private-leaderboard__panel">
              <div className="ppp-private-leaderboard__head">
                <strong>Party Leaderboard</strong>
                <span>Live</span>
              </div>
              {leaderboardRows.map(([rank, name, game, score, time]) => (
                <div className="ppp-private-rank" key={`${rank}-${name}`}>
                  <b>{rank}</b>
                  <span>
                    <strong>{name}</strong>
                    <small>{game}</small>
                  </span>
                  <em>{score}</em>
                  <small>{time}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="ppp-private-section ppp-private-section--panel">
        <div className="ppp-private-shell">
          <div className="ppp-private-section__header ppp-private-section__header--center">
            <p>Guest Reactions</p>
            <h2>They Came For A Party. They Left With Bragging Rights.</h2>
          </div>
          <div className="ppp-private-testimonials">
            {testimonials.map((item) => (
              <article key={item.name}>
                <p>&ldquo;{item.quote}&rdquo;</p>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-private-section">
        <div className="ppp-private-shell ppp-private-faq-wrap">
          <div className="ppp-private-section__header">
            <p>Questions</p>
            <h2>Everything You Need To Know.</h2>
          </div>
          <div className="ppp-private-faq">
            {faqs.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-private-final">
        <div className="ppp-private-shell">
          <p>Book Your Private Party</p>
          <h2>
            Ready To Own The <span>Leaderboard?</span>
          </h2>
          <div className="ppp-private-actions ppp-private-actions--center">
            <a className="ppp-private-btn ppp-private-btn--primary" href={contactUrl}>
              Inquire Now
            </a>
            <a className="ppp-private-btn ppp-private-btn--ghost" href={phoneUrl}>
              Call +1 (905) 760-2922
            </a>
          </div>
          <small>Pixel Pulse Play Vaughan | connect@pixelpulseplay.ca</small>
        </div>
      </section>
    </main>
  );
}
