import React from "react";
import "src/app/styles/home/pixelpulseSection.css";
import SectionHeading from "./SectionHeading";

const pixelPulseContent = {
  hero: {
    title: {
      titleOne:"Welcome to",
      titleTwo:"Pixel Pulse Vaughan"
    },
    description:
      "Pixel Pulse Vaughan is a next-generation indoor entertainment destination serving families across Vaughan, Woodbridge, Maple, and Concord. Our immersive play arena features interactive Pixel & tile games, physical and cognitive challenge rooms, arcade games, and private party spaces—designed for active, screen-powered fun with no trampolines. From birthday parties and school field trips to team events and group celebrations, Pixel Pulse delivers high-energy experiences that bring kids, families, and groups together from across the GTA."
  },

  whyChoose: {
    title: "Why Choose Pixel Pulse Vaughan?",
    description:
      "Pixel Pulse offers safe, supervised, and age-appropriate indoor fun for kids ages 5–12 across Vaughan, Woodbridge, Maple, and Concord. Our interactive Pixel & tile games and immersive challenge rooms encourage active play, teamwork, and confidence in a clean, staff-monitored environment. Trusted by parents, schools, and camps, Pixel Pulse is ideal for birthday parties, field trips, and group events kids love and adults trust."
  },

  attractions: {
    title: "All-New Attractions at Pixel Pulse Vaughan",
    list: [
      {
        name: "Interactive Pixel & Tile Games",
        description:
          "High-energy, sensor-based games that combine movement, speed, and strategy—perfect for kids, teams, and friendly competition."
      },
      {
        name: "Immersive Challenge Rooms",
        description:
          "Step into themed rooms that test agility, coordination, problem-solving, and focus through interactive light, sound, and motion gameplay."
      },
      {
        name: "Laser Challenge Room",
        description:
          "Dodge, duck, and move through laser beams in a fast-paced room designed for stealth, agility, and excitement."
      },
      {
        name: "Immersive and Skill Challenges",
        description:
          "Engaging immersive and interactive play elements designed for kids ages 5–12, with varying difficulty levels."
      },
      {
        name: "Sports Skill Games",
        description:
          "Interactive basketball, soccer, ball toss, and reaction-based games that encourage active play and teamwork."
      },
      {
        name: "Cognitive & Reaction Games",
        description:
          "Fun, brain-boosting games like memory, timing, and pattern challenges that build focus and confidence while playing."
      },
      {
        name: "Arcade Zone",
        description:
          "A curated mix of classic and modern arcade games—perfect for breaks between challenges and group fun."
      },
      {
        name: "Private Party & Group Spaces",
        description:
          "Dedicated rooms for birthday parties, school field trips, and team events—making celebrations easy and organized."
      }
    ]
  },

  cta: "Book your Pixel Pulse experience today and enjoy immersive games, parties, and nonstop fun in Vaughan.",

  tagLines: [
    ["PLAY. THINK. COMPETE. REPEAT.", "Indoor Interactive Gaming for Kids in Vaughan"],
    ["WHERE KIDS MOVE, THINK & WIN", "Next-Gen Active Gaming in the GTA"],
    ["SMARTER FUN STARTS HERE", "Safe, Active & Immersive Play for Kids"]
  ],

  highlights: [
    "A next-generation indoor gaming park for kids and families",
    "Interactive challenge rooms, arcades & party experiences",
    "Active play meets digital gaming — only at Pixel Pulse",
    "Vaughan’s newest destination for smart, active fun"
  ]
};


export default function PixelPulseVaughan() {
  return (
    <section className="pixel-pulse">
      <div className="container hero">
        <SectionHeading>
          {pixelPulseContent.hero.title.titleOne} <br /> <span>{pixelPulseContent.hero.title.titleTwo}</span>
        </SectionHeading>
        <p>{pixelPulseContent.hero.description}</p>
      </div>

      <div className="container section">
        <h2>{pixelPulseContent.whyChoose.title}</h2>
        <p>{pixelPulseContent.whyChoose.description}</p>
      </div>

      <div className="container section">
        <h2>{pixelPulseContent.attractions.title}</h2>
        <div className="grid">
          {pixelPulseContent.attractions.list.map((item, index) => (
            <div key={index} className="card">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>

     <!--<div className="container section cta-box">
        <p>{pixelPulseContent.cta}</p>
        <button>Book Now</button>
      </div>-->

      <div className="container section">
        <h2>Tag Lines</h2>
        <div className="tagline-grid">
          {pixelPulseContent.tagLines.map((tag, index) => (
            <div key={index} className="tag-card">
              <h4>{tag[0]}</h4>
              <span>{tag[1]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="container section">
        <ul className="highlights">
          {pixelPulseContent.highlights.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

