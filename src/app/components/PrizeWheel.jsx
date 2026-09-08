"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const wheelColors = ["#c8f135", "#ff8a2a", "#202736", "#8fae24", "#151c28", "#ffd15c", "#2a3344"];
const starBursts = [
  { left: "18%", top: "24%", delay: "0ms", size: "10px" },
  { left: "78%", top: "18%", delay: "60ms", size: "13px" },
  { left: "84%", top: "66%", delay: "120ms", size: "9px" },
  { left: "24%", top: "72%", delay: "180ms", size: "12px" },
  { left: "50%", top: "12%", delay: "240ms", size: "8px" },
  { left: "52%", top: "82%", delay: "300ms", size: "11px" },
];

function pickPrizeIndex(prizes) {
  if (prizes.length <= 1) return 0;
  if (typeof window === "undefined") return Math.floor(Math.random() * prizes.length);

  const values = new Uint32Array(1);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(values);
    return values[0] % prizes.length;
  }

  return Math.floor(Math.random() * prizes.length);
}

export default function PrizeWheel({ prizes = [] }) {
  const availablePrizes = useMemo(
    () => prizes.map((prize) => String(prize || "").trim()).filter(Boolean),
    [prizes],
  );
  const [rotation, setRotation] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => window.clearTimeout(timeoutRef.current);
  }, []);

  const wheelBackground = useMemo(() => {
    if (!availablePrizes.length) return "#202736";

    const segmentSize = 100 / availablePrizes.length;
    return `conic-gradient(${availablePrizes.map((_, index) => {
      const start = index * segmentSize;
      const end = start + segmentSize;
      return `${wheelColors[index % wheelColors.length]} ${start}% ${end}%`;
    }).join(", ")})`;
  }, [availablePrizes]);

  function spinWheel() {
    if (isSpinning || !availablePrizes.length) return;

    const selectedIndex = pickPrizeIndex(availablePrizes);
    const segmentDegrees = 360 / availablePrizes.length;
    const segmentCenter = selectedIndex * segmentDegrees + segmentDegrees / 2;
    const fullSpins = 5 + Math.floor(Math.random() * 3);

    window.clearTimeout(timeoutRef.current);
    setSelectedPrize("");
    setIsSpinning(true);
    setRotation((currentRotation) => currentRotation + fullSpins * 360 + (360 - segmentCenter));

    timeoutRef.current = window.setTimeout(() => {
      setSelectedPrize(availablePrizes[selectedIndex]);
      setBurstKey((key) => key + 1);
      setIsSpinning(false);
    }, 2600);
  }

  return (
    <div className="ppp-prize-wheel">
      <div className="ppp-prize-wheel__stage" aria-hidden="true">
        <span className="ppp-prize-wheel__pointer" />
        {selectedPrize ? (
          <div className="ppp-prize-wheel__stars" key={burstKey}>
            {starBursts.map((star, index) => (
              <span
                key={`${burstKey}-${index}`}
                style={{
                  "--star-delay": star.delay,
                  "--star-left": star.left,
                  "--star-size": star.size,
                  "--star-top": star.top,
                }}
              />
            ))}
          </div>
        ) : null}
        <div
          className="ppp-prize-wheel__disc"
          style={{
            "--wheel-rotation": `${rotation}deg`,
            "--wheel-background": wheelBackground,
          }}
        >
          <span />
        </div>
      </div>

      <button
        type="button"
        className="ppp-prize-wheel__button"
        disabled={isSpinning || !availablePrizes.length}
        onClick={spinWheel}
      >
        {isSpinning ? "Finding your prize..." : selectedPrize ? "Spin for another surprise" : "Tap to spin"}
      </button>

      <div className={`ppp-prize-wheel__result ${selectedPrize ? "has-prize" : ""}`} aria-live="polite">
        {selectedPrize ? (
          <>
            <span className="ppp-prize-wheel__result-stars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <small>You won</small>
            <strong>{selectedPrize}</strong>
          </>
        ) : (
          <p>Press the button and watch the wheel pick a reward.</p>
        )}
      </div>

      <div className="ppp-level-prize-grid">
        {availablePrizes.map((reward) => (
          <strong key={reward}>{reward}</strong>
        ))}
      </div>
    </div>
  );
}
