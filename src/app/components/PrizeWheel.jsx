"use client";

import { useMemo, useState } from "react";

const wheelColors = ["#c8f135", "#ff8a2a", "#202736", "#8fae24", "#151c28", "#ffd15c", "#2a3344"];

function pickPrizeIndex(prizes) {
  if (prizes.length <= 1) return 0;
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % prizes.length;
}

export default function PrizeWheel({ prizes = [] }) {
  const availablePrizes = useMemo(
    () => prizes.map((prize) => String(prize || "").trim()).filter(Boolean),
    [prizes],
  );
  const [rotation, setRotation] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);

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
    const nextRotation = rotation + fullSpins * 360 + (360 - segmentCenter);

    setSelectedPrize("");
    setIsSpinning(true);
    setRotation(nextRotation);

    window.setTimeout(() => {
      setSelectedPrize(availablePrizes[selectedIndex]);
      setIsSpinning(false);
    }, 2600);
  }

  return (
    <div className="ppp-prize-wheel">
      <div className="ppp-prize-wheel__stage" aria-hidden="true">
        <span className="ppp-prize-wheel__pointer" />
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
        {isSpinning ? "Spinning..." : selectedPrize ? "Spin again" : "Spin the wheel"}
      </button>

      <p className="ppp-prize-wheel__result" aria-live="polite">
        {selectedPrize ? `You landed on ${selectedPrize}` : "Tap spin to reveal a surprise reward."}
      </p>

      <div className="ppp-level-prize-grid">
        {availablePrizes.map((reward) => (
          <strong key={reward}>{reward}</strong>
        ))}
      </div>
    </div>
  );
}
