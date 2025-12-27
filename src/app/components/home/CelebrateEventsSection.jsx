import Link from "next/link";
import "src/app/styles/home/celebrateEventsSection.css";
import SectionHeading from "./SectionHeading";

export default function CelebrateEventsSection() {
    const eventCards = [
        {
            title: "CORPORATE EVENTS",
            img: "https://storage.googleapis.com/aerosports/team-building-aerosports-trampoline-park.png",
            desc:
                "Elevate your corporate events at Pixel Pulse, where immersive challenges inspire teamwork, strategic thinking, and shared wins in a high-energy environment.",
            link: "/groups-events/corporate-parties-events-groups",
            linkText: "More Info →",
            isNextLink: true
        },
        {
            title: "BIRTHDAY PARTIES",
            img: "https://storage.googleapis.com/aerosports/celeberate-your-birthday-parties-at-aerosports.png",
            desc:
                "The best kids birthday parties in Vaughan. All-inclusive Pixel & tile games, immersive fun, private room, party host, pizza, and excitement.",
            link: "/kids-birthday-parties",
            linkText: "COMPARE PACKAGES →"
        },
        {
            title: "FIELD TRIPS",
            img: "https://storage.googleapis.com/aerosports/schools-field-trips-at-aerosports.png",
            desc:
                "We offer special field trip and team event rates for groups of 20-40 players. For groups of 20+ or to book space and food, please call us.",
            link: "/groups-events/school-groups",
            linkText: "More Info →"
        }
    ];

    return (
        <section className="aero_home_article_section">
            <section className="aero-max-container">
                <SectionHeading className="section-heading-white">
                    <span>Celebrate</span> your event 
                </SectionHeading>


                <p>Elevate your event to next level at pixelpulseplay!</p>

                <div className="offer-section__inner container">
                    {eventCards.map((card, index) => (
                        <article className="offer-card" key={index}>
                            <div
                                className="offer-card__img"
                                style={{ backgroundImage: `url('${card.img}')` }}
                                role="img"
                                aria-label={card.title}
                            >
                                <h3 className="offer-card__title">{card.title}</h3>
                            </div>

                            <div className="offer-card__body">
                                <p>{card.desc}</p>

                                {card.isNextLink ? (
                                    <Link href={card.link} className="sigma_btn-custom">
                                        {card.linkText}
                                    </Link>
                                ) : (
                                    <a href={card.link} className="sigma_btn-custom">
                                        {card.linkText}
                                    </a>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </section>
    );
}
