"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function RewardLadderCarousel({ rewards = [] }) {
  const listRef = useRef(null);
  const rewardItems = useMemo(() => rewards.filter((reward) => reward?.reward), [rewards]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    const card = list?.children[0];
    if (!list || !card) return;

    window.requestAnimationFrame(() => {
      list.scrollLeft = Math.max(0, card.offsetLeft - list.offsetLeft);
      setActiveIndex(0);
    });
  }, []);

  function scrollToIndex(index) {
    const list = listRef.current;
    if (!list || !rewardItems.length) return;

    const nextIndex = Math.max(0, Math.min(index, rewardItems.length - 1));
    const card = list.children[nextIndex];
    if (!card) return;

    card.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
    setActiveIndex(nextIndex);
  }

  function handleScroll() {
    const list = listRef.current;
    if (!list) return;

    const listBounds = list.getBoundingClientRect();
    const listCenter = listBounds.left + listBounds.width / 2;
    const cards = Array.from(list.children);
    const closest = cards.reduce((best, card, index) => {
      const cardBounds = card.getBoundingClientRect();
      const cardCenter = cardBounds.left + cardBounds.width / 2;
      const distance = Math.abs(cardCenter - listCenter);
      return distance < best.distance ? { index, distance } : best;
    }, { index: 0, distance: Infinity });

    setActiveIndex(closest.index);
  }

  return (
    <div className="ppp-reward-carousel">
      <div className="ppp-reward-carousel__controls" aria-label="Reward ladder carousel controls">
        <div className="ppp-reward-carousel__summary">
          <span>Swipeable Reward Ladder</span>
          <small>Drag the cards, tap dots, or use controls to browse all {rewardItems.length} rewards.</small>
        </div>
        <div className="ppp-reward-carousel__buttons">
          <button
            type="button"
            aria-label="Previous reward level"
            disabled={activeIndex === 0}
            onClick={() => scrollToIndex(activeIndex - 1)}
          >
            Prev
          </button>
          <button
            type="button"
            aria-label="Next reward level"
            disabled={activeIndex >= rewardItems.length - 1}
            onClick={() => scrollToIndex(activeIndex + 1)}
          >
            Next
          </button>
        </div>
      </div>

      <div className="ppp-reward-carousel__viewport">
        <div className="ppp-level-tier-list" role="list" ref={listRef} onScroll={handleScroll}>
          {rewardItems.map((item, index) => {
            return (
              <article className="ppp-level-tier-row" key={item.level || item.reward} role="listitem">
                <div className="ppp-level-tier-row__top">
                  <div className="ppp-level-tier-row__badge">
                    <span>{index + 1}</span>
                  </div>
                </div>
                <div>
                  <span>{item.level}</span>
                  <h3>{item.reward}</h3>
                  <p>{item.detail}</p>
                </div>
                <strong className="ppp-level-tier-row__threshold">
                  <span>Unlocks at</span>
                  {item.threshold}
                </strong>
              </article>
            );
          })}
        </div>
      </div>

      <div className="ppp-reward-carousel__dots" aria-label="Reward level slides">
        {rewardItems.map((item, index) => (
          <button
            type="button"
            key={item.level || item.reward}
            className={activeIndex === index ? "is-active" : ""}
            aria-label={`Show reward level ${index + 1}`}
            onClick={() => scrollToIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
