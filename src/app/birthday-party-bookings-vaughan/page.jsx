import Image from "next/image";
import "../styles/birthday-landing.css";
import "../styles/birthday-bookings-vaughan.css";
import BirthdayHeroContactForm from "@/components/BirthdayHeroContactForm";
import BookingButton from "@/components/smallComponents/BookingButton";
import { fetchMenuData } from "@/lib/sheets";
import { safeImageUrl } from "@/lib/seo";

const heroImage = "/assets/images/birthday-party-room-hero.webp";
const heroVideo = "/assets/videos/birthday-hero.mp4";
const localFloorImage = "/assets/images/floorchallenge.jpg";
const localShootingImage = "/assets/images/shootinggame.jpg";
const LOCATION_SLUG = "vaughan";
const attractionFallbackImage = "https://storage.googleapis.com/pixel-pulse-play/web/PrivateParty.png";
const phoneUrl = "tel:+19057602922";
const pageUrl = "https://parties.pixelpulseplay.ca";
const ogImage = `${pageUrl}/assets/images/birthday-party-room-hero.webp`;

export const revalidate = 900;

export const metadata = {
  title: "Kids & Teens Birthday Party Bookings Vaughan | Pixel Pulse Play",
  description:
    "Book a kids, tweens, or teens birthday party in Vaughan with interactive challenge rooms, hosted gameplay, private party rooms, and high-energy indoor fun.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Kids & Teens Birthday Party Bookings Vaughan | Pixel Pulse Play",
    description:
      "A high-energy birthday party in Vaughan with real-life gaming, interactive challenge rooms, hosted competitions, and private party rooms.",
    url: pageUrl,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "Pixel Pulse Play birthday party room in Vaughan",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kids & Teens Birthday Party Bookings Vaughan | Pixel Pulse Play",
    description:
      "Interactive birthday party bookings for kids, tweens, and teens in Vaughan.",
    images: [ogImage],
  },
};

const navLinks = [
  { label: "Highlights", href: "#highlights" },
  { label: "Games", href: "#games" },
  { label: "Packages", href: "#packages" },
  { label: "FAQ", href: "#faq" },
];

const heroStats = [
  { value: "10+", label: "games" },
  { value: "Ages 6-16", label: "kids and teens" },
  { value: "Vaughan", label: "indoor venue" },
];

const highlights = [
  {
    title: "Interactive challenge rooms",
    text: "Real-life gaming experiences with lights, targets, missions, and fast reactions.",
  },
  {
    title: "Team battles and competitions",
    text: "Perfect for groups, siblings, friends, and anyone chasing the high score.",
  },
  {
    title: "Guided party experience",
    text: "Hosted gameplay keeps the group organized, moving, and fully engaged.",
  },
  {
    title: "Private party rooms",
    text: "Celebrate, eat, open gifts, and take photos together after the games.",
  },
  {
    title: "Indoor summer fun",
    text: "Air-conditioned, weather-proof birthday fun without heat, rain, or party-hall boredom.",
  },
  {
    title: "Social-media worthy moments",
    text: "Colorful party rooms, action shots, and memorable moments parents can actually capture.",
  },
];

const fallbackAttractions = [
  {
    title: "Laser Maze",
    image: localFloorImage,
    text: "Duck, dodge, and crawl through laser beams before time runs out.",
  },
  {
    title: "Hexa Quest",
    image: localFloorImage,
    text: "Solve physical puzzles, unlock clues, and race against time.",
  },
  {
    title: "Edge Climb",
    image: localFloorImage,
    text: "Crawl, balance, climb, and move through an active challenge room.",
  },
  {
    title: "Shoot It Out",
    image: localShootingImage,
    text: "Team-based target action with zones, sensors, and light-up tiles.",
  },
];

const partyFeatures = [
  "Dedicated party rooms",
  "Guided gameplay rotations",
  "Music and high-energy atmosphere",
  "Food and add-ons available",
  "Easy online booking",
  "Great for kids, tweens, and teens",
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

const reviews = [
  "Best birthday party we have ever done.",
  "Finally something my 12-year-old actually loved.",
  "The kids did not want to leave.",
  "So much better than a regular trampoline park.",
];

const faqs = [
  {
    question: "What ages is Pixel Pulse best for?",
    answer:
      "Pixel Pulse is designed for kids, tweens, and teens, with the strongest fit around ages 6 to 16.",
  },
  {
    question: "How long are parties?",
    answer:
      "Party timing depends on the package and group size. Send a request and the team will confirm the best available options.",
  },
  {
    question: "Can we bring cake?",
    answer:
      "Yes, parties can include time in a party room for cake, food, gifts, and photos.",
  },
  {
    question: "Do you provide food?",
    answer:
      "Food and add-ons may be available depending on the party package and date.",
  },
  {
    question: "Are socks required?",
    answer:
      "The team will confirm any footwear or play requirements with your booking details.",
  },
  {
    question: "How many kids can attend?",
    answer:
      "Capacity depends on the party format. Share your expected guest count and we will recommend the right package.",
  },
  {
    question: "Can parents stay?",
    answer:
      "Yes, parents can stay during the party and enjoy the celebration flow.",
  },
  {
    question: "Is it private?",
    answer:
      "Private party room access is included with party experiences, and larger private options can be discussed when booking.",
  },
];

async function getBirthdayMenuData() {
  try {
    return await fetchMenuData(LOCATION_SLUG);
  } catch (error) {
    console.error("birthday bookings menu failed:", error);
    return [];
  }
}

function getAttractions(menuData = []) {
  const attractions = menuData.find((item) => item.path === "attractions");
  const children = Array.isArray(attractions?.children) ? attractions.children : [];

  return children
    .filter((item) => item?.isactive == 1)
    .map((item) => ({
      title: item.title || item.desc,
      text: item.smalltext || item.metadescription || "",
      image: safeImageUrl(item.smallimage || item.icon || item.headerimage, attractionFallbackImage),
    }));
}

export default async function BirthdayPartyBookingsVaughanPage() {
  const menuData = await getBirthdayMenuData();
  const attractions = getAttractions(menuData);
  const gameCards = attractions.length ? attractions : fallbackAttractions;

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
        <video
          className="ppp-bday-booking-hero__media"
          autoPlay
          loop
          muted
          playsInline
          poster={heroImage}
          aria-label="Pixel Pulse Play birthday party video with kids and teens celebrating interactive games"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="ppp-bday-booking-shell ppp-bday-booking-hero__layout">
          <div className="ppp-bday-booking-hero__copy">
            <p className="ppp-bday-kicker">Birthday parties in Vaughan</p>
            <h1>Birthday parties kids get excited about.</h1>
            <p>
              Interactive challenge rooms for kids, tweens, and teens.
            </p>
            <div className="ppp-bday-booking-actions">
              <BookingButton title="Book your party" bookingType="party" />
              <a href="#packages">View party packages</a>
            </div>
            <div className="ppp-bday-hero-stats" aria-label="Birthday party highlights">
              {heroStats.map((item) => (
                <div key={item.value}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <BirthdayHeroContactForm urgency="Summer weekend spots fill quickly. Reserve your preferred party date today." />
        </div>
      </section>

      <section className="ppp-bday-booking-section ppp-bday-booking-section--packages" id="packages">
        <div className="ppp-bday-booking-shell">
          <div className="ppp-bday-section-heading ppp-bday-section-heading--center">
            <p>Party packages</p>
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

      <section className="ppp-bday-booking-section ppp-bday-booking-section--highlights" id="highlights">
        <div className="ppp-bday-booking-shell">
          <div className="ppp-bday-section-heading ppp-bday-section-heading--center">
            <p>Quick highlights</p>
            <h2>Everything kids and teens love without anything they will call boring.</h2>
          </div>
          <div className="ppp-bday-highlight-grid">
            {highlights.map((item, index) => (
              <article key={item.title} tabIndex={0}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-bday-booking-section" id="positioning">
        <div className="ppp-bday-booking-shell ppp-bday-positioning ppp-bday-positioning--media">
          <div className="ppp-bday-section-heading">
            <p>What makes Pixel Pulse different</p>
            <h2>Not another indoor playground.</h2>
            <p className="ppp-bday-section-copy">
              Pixel Pulse turns kids into players inside real-life video games. Run
              through laser mazes, hit glowing targets, race against the clock, compete
              with friends, and unlock challenges together.
            </p>
            <p className="ppp-bday-section-copy ppp-bday-section-copy--contrast">
              Every room is interactive, active, and designed to keep kids moving,
              laughing, and fully engaged. No screens, no sitting around, just real action.
            </p>
          </div>
          <div className="ppp-bday-experience-grid ppp-bday-experience-grid--compact">
            <article>
              <Image src={localFloorImage} alt="" width={720} height={520} sizes="(max-width: 900px) 100vw, 33vw" />
              <div>
                <h3>Movement games</h3>
                <p>Fast rooms built for running, reacting, and replaying.</p>
              </div>
            </article>
            <article>
              <Image src={localShootingImage} alt="" width={720} height={520} sizes="(max-width: 900px) 100vw, 33vw" />
              <div>
                <h3>Target challenges</h3>
                <p>Lights, targets, speed, and instant competition.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="ppp-bday-booking-section ppp-bday-booking-section--games" id="games">
        <div className="ppp-bday-booking-shell">
          <div className="ppp-bday-section-heading">
            <p>Featured games</p>
            <h2>Every room is a new challenge.</h2>
          </div>
          <div className="ppp-birthday-attraction-carousel ppp-bday-game-carousel" aria-label="Featured Pixel Pulse games">
            {gameCards.map((game) => (
              <article className="ppp-birthday-attraction-card ppp-bday-game-card" key={game.title}>
                <Image
                  src={game.image}
                  alt=""
                  width={800}
                  height={600}
                  style={{ width: "100%", height: "auto" }}
                />
                <div>
                  <h3>{game.title}</h3>
                  <p>{game.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-bday-booking-section ppp-bday-booking-section--party">
        <div className="ppp-bday-booking-shell ppp-bday-party-layout">
          <div className="ppp-bday-section-heading">
            <p>Party experience</p>
            <h2>We handle the chaos while you enjoy the celebration.</h2>
            <p className="ppp-bday-section-copy">
              Your party host keeps everything moving while kids jump into guided
              game challenges and team competitions. You celebrate. We handle the fun.
            </p>
          </div>
          <div className="ppp-bday-party-panel">
            {partyFeatures.map((feature) => (
              <span key={feature}>{feature}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-bday-booking-section ppp-bday-booking-section--summer">
        <div className="ppp-bday-booking-shell ppp-bday-summer">
          <div className="ppp-bday-section-heading">
            <p>Summer birthday positioning</p>
            <h2>The ultimate summer birthday experience.</h2>
            <p className="ppp-bday-section-copy">
              Skip the same old birthday party this summer. Pixel Pulse delivers
              air-conditioned indoor fun, active gameplay, immersive challenges, and
              unforgettable memories without worrying about weather, heat, or boring
              party halls.
            </p>
          </div>
          <a href="#birthday-party-form">Check available dates</a>
        </div>
      </section>

      <section className="ppp-bday-booking-section ppp-bday-booking-section--reviews">
        <div className="ppp-bday-booking-shell">
          <div className="ppp-bday-section-heading ppp-bday-section-heading--center">
            <p>Social proof</p>
            <h2>Why families love Pixel Pulse.</h2>
          </div>
          <div className="ppp-bday-review-grid">
            {reviews.map((review) => (
              <article key={review}>
                <p>{review}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-bday-booking-section ppp-bday-booking-section--light" id="faq">
        <div className="ppp-bday-booking-shell ppp-bday-faq-layout">
          <div className="ppp-bday-section-heading">
            <p>FAQ</p>
            <h2>Questions parents usually ask.</h2>
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
            <p>Book your party</p>
            <h2>Ready to give them a birthday they will never forget?</h2>
            <span>Summer weekend spots fill quickly. Reserve your preferred party date today.</span>
          </div>
          <div className="ppp-bday-final__actions">
            <BookingButton title="Book your party" bookingType="party" />
            <a href={phoneUrl}>Call now</a>
          </div>
        </div>
      </section>
    </main>
  );
}
