"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const CURRENT_LEVEL_INDEX = 3;

function getCardState(index) {
  return {
    isCurrent: index === CURRENT_LEVEL_INDEX,
    isLocked: index > CURRENT_LEVEL_INDEX,
    isMajor: index >= 7,
    isVip: index === 9,
  };
}

export default function RewardLadderCarousel({ rewards = [] }) {
  const listRef = useRef(null);
  const rewardItems = useMemo(() => rewards.filter((reward) => reward?.reward), [rewards]);
  const startIndex = Math.min(CURRENT_LEVEL_INDEX, Math.max(0, rewardItems.length - 1));
  const [activeIndex, setActiveIndex] = useState(startIndex);

  useEffect(() => {
    const list = listRef.current;
    const card = list?.children[startIndex];
    if (!list || !card) return;

    window.requestAnimationFrame(() => {
      list.scrollLeft = Math.max(0, card.offsetLeft - list.offsetLeft);
      setActiveIndex(startIndex);
    });
  }, [startIndex]);

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
            aria-label="Show current reward level"
            onClick={() => scrollToIndex(startIndex)}
          >
            Current
          </button>
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
            const { isCurrent, isLocked, isMajor, isVip } = getCardState(index);
            const statusLabel = isCurrent ? "Current level" : isLocked ? "Locked" : "Unlocked";
            const tierState = [
              isCurrent ? "is-current" : "",
              isLocked ? "is-locked" : "is-unlocked",
              isVip ? "is-vip" : isMajor ? "is-major" : "",
            ].filter(Boolean).join(" ");

            return (
              <article className={`ppp-level-tier-row ${tierState}`} key={item.level || item.reward} role="listitem">
                <div className="ppp-level-tier-row__top">
                  <div className="ppp-level-tier-row__badge">
                    <span>{index + 1}</span>
                  </div>
                  <strong className="ppp-level-tier-row__status">{statusLabel}</strong>
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
            className={[
              activeIndex === index ? "is-active" : "",
              startIndex === index ? "is-current" : "",
            ].filter(Boolean).join(" ")}
            aria-label={`Show reward level ${index + 1}${startIndex === index ? ", current level" : ""}`}
            onClick={() => scrollToIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
