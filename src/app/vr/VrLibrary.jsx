"use client";

import { useState } from "react";

/**
 * Filterable VR experience library. Renders category tabs and shows one
 * category at a time (or "All") to keep the page compact. Data is passed in
 * from the server page so the catalogue stays in one place.
 */
export default function VrLibrary({ categories = [] }) {
  const tabs = ["All", ...categories.map((cat) => cat.name)];
  const [active, setActive] = useState(categories[0]?.name || "All");
  const shown =
    active === "All" ? categories : categories.filter((cat) => cat.name === active);

  return (
    <>
      <div className="ppp-vr-filters" role="tablist" aria-label="Filter VR experiences">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active === tab}
            className={`ppp-vr-filter${active === tab ? " is-active" : ""}`}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {shown.map((cat) => (
        <div className="ppp-vr-cat" key={cat.name}>
          <div className="ppp-vr-cat__head">
            <h3 className="ppp-vr-cat__title">{cat.name}</h3>
            <span className="ppp-vr-cat__count">{cat.games.length} titles</span>
          </div>
          <div className="ppp-vr-grid">
            {cat.games.map((game) => (
              <article
                className="ppp-vr-card"
                key={game.title}
                style={{ "--vr-accent": cat.accent }}
              >
                <div className="ppp-vr-card__cover">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="ppp-vr-card__img"
                    src={game.img}
                    alt={game.title}
                    loading="lazy"
                  />
                  <span aria-hidden="true">{cat.icon}</span>
                </div>
                <div className="ppp-vr-card__body">
                  <h4 className="ppp-vr-card__title">{game.title}</h4>
                  <p className="ppp-vr-card__desc">{game.desc}</p>
                  <div className="ppp-vr-tags">
                    {game.tags.map((tag, index) => (
                      <span
                        className={`ppp-vr-tag${index === 0 ? " ppp-vr-tag--accent" : ""}`}
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
