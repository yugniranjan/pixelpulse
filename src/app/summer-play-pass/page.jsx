import Image from "next/image";
import "../styles/summer-play-pass.css";
import { canonicalUrl, getCanonicalSiteUrl } from "@/lib/seo";

const logo = "/assets/images/logoD.png";
const arcadeImage = "/assets/images/arcade.JPG";
const floorImage = "/assets/images/floorchallenge.jpg";
const shootingImage = "/assets/images/shootinggame.jpg";
const siteUrl = getCanonicalSiteUrl();

const games = [
  {
    name: "Laser Maze",
    genre: "Agility / Stealth",
    emoji: "⚡",
    tags: ["Challenge", "Timed"],
    image: floorImage,
  },
  {
    name: "Hexa Quest",
    genre: "Puzzle / Reflex",
    emoji: "⬢",
    tags: ["Interactive", "Strategy"],
    image: arcadeImage,
  },
  {
    name: "Edge Climb",
    genre: "Climb / Balance",
    emoji: "🧗",
    tags: ["Active", "Skill"],
    image: floorImage,
  },
  {
    name: "Shoot It Out",
    genre: "Target / Action",
    emoji: "🎯",
    tags: ["Head-to-head", "Fast"],
    image: shootingImage,
  },
  {
    name: "Tile Hunt",
    genre: "Speed / Memory",
    emoji: "🟩",
    tags: ["Reflex", "Score"],
    image: floorImage,
  },
  {
    name: "Basket Ball",
    genre: "Sports / Accuracy",
    emoji: "🏀",
    tags: ["Classic", "Arcade"],
    image: arcadeImage,
  },
  {
    name: "Maze Gate",
    genre: "Puzzle / Movement",
    emoji: "🚪",
    tags: ["Team", "Challenge"],
    image: floorImage,
  },
  {
    name: "Soccer Challenge",
    genre: "Sports / Power",
    emoji: "⚽",
    tags: ["Active", "Family"],
    image: arcadeImage,
  },
  {
    name: "Ball Toss",
    genre: "Aim / Score",
    emoji: "🎪",
    tags: ["Quick Play", "Fun"],
    image: shootingImage,
  },
  {
    name: "Pizza Delivery",
    genre: "Mission / Reaction",
    emoji: "🍕",
    tags: ["Kids Love It", "Quest"],
    image: floorImage,
  },
  {
    name: "T-Rex Heist",
    genre: "Adventure / Escape",
    emoji: "🦖",
    tags: ["Adventure", "Immersive"],
    image: arcadeImage,
  },
  {
    name: "Seashells",
    genre: "Search / Score",
    emoji: "🐚",
    tags: ["Family", "Discovery"],
    image: floorImage,
  },
];

const features = [
  {
    icon: "🎮",
    title: "Play More, Repeat Often",
    description: "Built for summer visits when kids want to come back, try another challenge, and beat their last score.",
  },
  {
    icon: "👟",
    title: "Active Indoor Fun",
    description: "A high-energy alternative to screen time, with games that get players moving, aiming, climbing, and reacting.",
  },
  {
    icon: "🏆",
    title: "Score-Chasing Challenges",
    description: "Every visit can become a rematch with friends, siblings, parents, or your own best time.",
  },
  {
    icon: "☀️",
    title: "Summer-Friendly Plans",
    description: "Choose a simple pass option for quick visits, longer play sessions, or family days at Pixel Pulse.",
  },
];

const plans = [
  {
    name: "Quick Play",
    description: "A lighter summer visit for players who want a fast burst of Pixel Pulse action.",
    price: "30",
    period: "min",
    button: "Book Quick Play",
    featured: false,
    features: ["Challenge room access", "Great for first timers", "Score-based games", "Easy weekday add-on"],
  },
  {
    name: "Summer Play Pass",
    description: "The sweet spot for families who want enough time to try more games and chase better scores.",
    price: "60",
    period: "min",
    button: "Book Play Pass",
    featured: true,
    features: ["Most popular session length", "Multiple Pixel Pulse attractions", "Perfect for friends and siblings", "Best for repeat challenges", "Indoor summer fun"],
  },
  {
    name: "Extended Play",
    description: "More time, more rematches, and more room to explore the full Pixel Pulse lineup.",
    price: "90",
    period: "min",
    button: "Book Extended Play",
    featured: false,
    features: ["Longest play window", "Ideal for groups", "More time per attraction", "Great for rainy-day plans"],
  },
];

const reviews = [
  {
    quote: "The kids kept asking to go back because every game felt different. It was active, loud, and exactly the kind of summer day we needed.",
    name: "Parent guest",
    detail: "Vaughan visit",
    avatar: "👩",
  },
  {
    quote: "Laser Maze and Shoot It Out turned into instant rematches. Everyone wanted one more try.",
    name: "Group player",
    detail: "Challenge room fan",
    avatar: "🧒",
  },
  {
    quote: "Perfect indoor option when it was too hot outside. The kids burned energy and we did not have to plan a whole production.",
    name: "Family guest",
    detail: "Summer outing",
    avatar: "👨",
  },
];

export const metadata = {
  title: "Summer Play Pass | Pixel Pulse Play Vaughan",
  description:
    "Book a Pixel Pulse Summer Play Pass in Vaughan for active indoor games, challenge rooms, arcade-style scoring, and family fun.",
  alternates: {
    canonical: canonicalUrl("/summer-play-pass"),
  },
  openGraph: {
    title: "Summer Play Pass | Pixel Pulse Play Vaughan",
    description: "Active indoor summer fun with Pixel Pulse games and challenge rooms.",
    images: [`${siteUrl}${arcadeImage}`],
  },
};

export default function SummerPlayPassPage() {
  const marqueeGames = [...games.slice(0, 10), ...games.slice(0, 10)];

  return (
    <main className="ppp-summer-page">
      <nav className="ppp-summer-nav" aria-label="Summer Play Pass navigation">
        <a className="ppp-summer-logo" href="#top" aria-label="Pixel Pulse Play Summer Play Pass">
          <Image src={logo} alt="Pixel Pulse Play" width={172} height={78} priority />
        </a>
        <div className="ppp-summer-nav__links">
          <a href="#games">Games</a>
          <a href="#features">Why Visit</a>
          <a href="#pricing">Passes</a>
          <a className="ppp-summer-nav__cta" href="#pricing">Get Pass</a>
        </div>
      </nav>

      <section className="ppp-summer-hero" id="top">
        <div className="ppp-summer-rays" />
        <div className="ppp-summer-sun" />
        <div className="ppp-summer-hero__image" aria-hidden="true">
          <Image src={arcadeImage} alt="" fill priority sizes="100vw" />
        </div>
        <div className="ppp-summer-hero__content">
          <span className="ppp-summer-badge">Summer 2026 | Limited Time</span>
          <h1>
            <span>Unlock the</span>
            <strong>Summer Play Pass</strong>
          </h1>
          <p>
            Beat the heat with active indoor games, challenge rooms, arcade-style scoring, and all the rematches your crew can handle.
          </p>
          <div className="ppp-summer-actions">
            <a className="ppp-summer-btn ppp-summer-btn--primary" href="#pricing">Get My Pass</a>
            <a className="ppp-summer-btn ppp-summer-btn--secondary" href="#games">Browse Games</a>
          </div>
          <div className="ppp-summer-stats" aria-label="Summer Play Pass highlights">
            <div><strong>12+</strong><span>Attractions</span></div>
            <div><strong>3</strong><span>Pass Options</span></div>
            <div><strong>100%</strong><span>Indoor Fun</span></div>
            <div><strong>Vaughan</strong><span>Location</span></div>
          </div>
        </div>
      </section>

      <div className="ppp-summer-marquee" aria-label="Pixel Pulse games">
        <div>
          {marqueeGames.map((game, index) => (
            <span key={`${game.name}-${index}`}>
              {game.emoji} {game.name}
              <b>✦</b>
            </span>
          ))}
        </div>
      </div>

      <section className="ppp-summer-section ppp-summer-games" id="games">
        <div className="ppp-summer-inner">
          <div className="ppp-summer-section__header">
            <span>What&apos;s Included</span>
            <h2>Pixel Pulse Summer Lineup</h2>
            <p>Swap screen time for active challenges, score chasing, and games that feel different every time you play.</p>
          </div>
          <div className="ppp-summer-games__grid">
            {games.map((game) => (
              <article className="ppp-summer-game-card" key={game.name}>
                <div className="ppp-summer-game-card__media">
                  <Image src={game.image} alt="" fill sizes="(max-width: 760px) 100vw, 25vw" />
                  <span>{game.emoji}</span>
                </div>
                <div className="ppp-summer-game-card__body">
                  <h3>{game.name}</h3>
                  <p>{game.genre}</p>
                  <div>
                    {game.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-summer-section ppp-summer-features" id="features">
        <div className="ppp-summer-inner ppp-summer-features__grid">
          <div>
            <span className="ppp-summer-label">Why Play Pass</span>
            <h2>Everything you need for an easy summer outing</h2>
            <div className="ppp-summer-features__list">
              {features.map((feature) => (
                <article className="ppp-summer-feature" key={feature.title}>
                  <span>{feature.icon}</span>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="ppp-summer-stack" aria-hidden="true">
            <div className="ppp-summer-stack-card ppp-summer-stack-card--one">
              <strong>Summer Score Run</strong>
              <span>Laser Maze | Tile Hunt | Shoot It Out</span>
            </div>
            <div className="ppp-summer-stack-card ppp-summer-stack-card--two">
              <strong>Friend Rematch</strong>
              <span>Bring your crew and chase the board</span>
            </div>
            <div className="ppp-summer-stack-card ppp-summer-stack-card--three">
              <strong>Play Pass Active</strong>
              <span>Indoor challenges | Vaughan, ON</span>
            </div>
          </div>
        </div>
      </section>

      <section className="ppp-summer-section ppp-summer-pricing" id="pricing">
        <div className="ppp-summer-inner">
          <div className="ppp-summer-section__header">
            <span>Choose Your Pass</span>
            <h2>Simple Summer Play Options</h2>
            <p>Pick your play time and step into Pixel Pulse. Final pricing and availability can be confirmed at booking.</p>
          </div>
          <div className="ppp-summer-pricing__grid">
            {plans.map((plan) => (
              <article className={`ppp-summer-plan ${plan.featured ? "is-featured" : ""}`} key={plan.name}>
                {plan.featured ? <span className="ppp-summer-plan__badge">Most Popular</span> : null}
                <h3>{plan.name}</h3>
                <p>{plan.description}</p>
                <div className="ppp-summer-plan__price">
                  <strong>{plan.price}</strong>
                  <span>{plan.period}</span>
                </div>
                <ul>
                  {plan.features.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <a className={plan.featured ? "ppp-summer-plan__button is-filled" : "ppp-summer-plan__button"} href="/pricing-promos">
                  {plan.button}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-summer-section ppp-summer-reviews">
        <div className="ppp-summer-inner">
          <div className="ppp-summer-section__header">
            <span>Guest Love</span>
            <h2>Kids and parents agree</h2>
          </div>
          <div className="ppp-summer-reviews__grid">
            {reviews.map((review) => (
              <article className="ppp-summer-review" key={review.name}>
                <div>★★★★★</div>
                <p>&ldquo;{review.quote}&rdquo;</p>
                <footer>
                  <span>{review.avatar}</span>
                  <div>
                    <strong>{review.name}</strong>
                    <small>{review.detail}</small>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-summer-cta">
        <div>
          <span className="ppp-summer-label">Don&apos;t Miss Out</span>
          <h2>Summer only lasts so long.</h2>
          <p>Plan a cool indoor play day at Pixel Pulse and let the kids burn energy in the best way.</p>
          <a className="ppp-summer-btn ppp-summer-btn--primary" href="/pricing-promos">Grab Your Pass Now</a>
          <small>No auto-renewal | Session availability may vary | Vaughan, ON</small>
        </div>
      </section>

      <footer className="ppp-summer-footer">
        <Image src={logo} alt="Pixel Pulse Play" width={138} height={62} />
        <nav aria-label="Summer footer links">
          <a href="/kids-birthday-parties">Birthday Parties</a>
          <a href="/pricing-promos">Pricing</a>
          <a href="/contactus">Contact</a>
        </nav>
        <p>© 2026 Pixel Pulse Play. All rights reserved.</p>
      </footer>
    </main>
  );
}
