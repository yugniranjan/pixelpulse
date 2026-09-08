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

export default function PrizeWheel({ prizes = [], spinKey = "", oneSpinOnly = false }) {
  const availablePrizes = useMemo(
    () => prizes.map((prize) => String(prize || "").trim()).filter(Boolean),
    [prizes],
  );
  const [rotation, setRotation] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasUsedSpin, setHasUsedSpin] = useState(false);
  const [isCheckingSpin, setIsCheckingSpin] = useState(false);
  const [spinError, setSpinError] = useState("");
  const [burstKey, setBurstKey] = useState(0);
  const timeoutRef = useRef(null);
  const storageKey = spinKey ? `ppp-reward-wheel-spin:${spinKey}` : "";

  useEffect(() => {
    return () => window.clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (!oneSpinOnly || !storageKey || typeof window === "undefined") {
      setHasUsedSpin(false);
      return;
    }

    let ignore = false;
    setIsCheckingSpin(true);

    async function loadSpinStatus() {
      try {
        const response = await fetch(`/api/rewards/spin?identifier=${encodeURIComponent(spinKey)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to check prize wheel spin.");
        }

        if (ignore) return;

        if (data.spin?.prize) {
          setSelectedPrize(data.spin.prize);
          setHasUsedSpin(true);
          try {
            window.localStorage.setItem(storageKey, JSON.stringify(data.spin));
          } catch {
            // Local storage is only a convenience cache; the server is the source of truth.
          }
        } else {
          setSelectedPrize("");
          setHasUsedSpin(false);
          window.localStorage.removeItem(storageKey);
        }
      } catch {
        if (ignore) return;
        try {
          const savedSpin = window.localStorage.getItem(storageKey);
          const savedPrize = savedSpin ? JSON.parse(savedSpin)?.prize : "";
          setSelectedPrize(savedPrize || "");
          setHasUsedSpin(Boolean(savedPrize));
        } catch {
          setSelectedPrize("");
          setHasUsedSpin(false);
        }
      } finally {
        if (!ignore) setIsCheckingSpin(false);
      }
    }

    loadSpinStatus();

    return () => {
      ignore = true;
    };
  }, [oneSpinOnly, spinKey, storageKey]);

  const wheelBackground = useMemo(() => {
    if (!availablePrizes.length) return "#202736";

    const segmentSize = 100 / availablePrizes.length;
    return `conic-gradient(${availablePrizes.map((_, index) => {
      const start = index * segmentSize;
      const end = start + segmentSize;
      return `${wheelColors[index % wheelColors.length]} ${start}% ${end}%`;
    }).join(", ")})`;
  }, [availablePrizes]);

  function revealPrize(prize) {
    const selectedIndex = Math.max(0, availablePrizes.indexOf(prize));
    const segmentDegrees = 360 / availablePrizes.length;
    const segmentCenter = selectedIndex * segmentDegrees + segmentDegrees / 2;
    const fullSpins = 5 + Math.floor(Math.random() * 3);

    window.clearTimeout(timeoutRef.current);
    setSelectedPrize("");
    setIsSpinning(true);
    setRotation((currentRotation) => currentRotation + fullSpins * 360 + (360 - segmentCenter));

    timeoutRef.current = window.setTimeout(() => {
      setSelectedPrize(prize);
      setHasUsedSpin(Boolean(oneSpinOnly));
      if (oneSpinOnly && storageKey) {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify({
            prize,
            spunAt: new Date().toISOString(),
          }));
        } catch {
          // If storage is blocked, keep the one-spin state for this page session.
        }
      }
      setBurstKey((key) => key + 1);
      setIsSpinning(false);
    }, 2600);
  }

  async function spinWheel() {
    if (isCheckingSpin || isSpinning || hasUsedSpin || !availablePrizes.length) return;

    setSpinError("");

    if (oneSpinOnly && !spinKey) {
      setSpinError("Open your dashboard with an email or phone before spinning.");
      return;
    }

    if (oneSpinOnly && spinKey) {
      setIsSpinning(true);

      try {
        const response = await fetch("/api/rewards/spin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: spinKey, prizes: availablePrizes }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to spin the prize wheel.");
        }

        if (data.spin?.alreadySpun) {
          setSelectedPrize(data.spin.prize || "");
          setHasUsedSpin(true);
          setIsSpinning(false);
          return;
        }

        if (data.spin?.prize) {
          revealPrize(data.spin.prize);
          return;
        }
      } catch (error) {
        setSpinError(error.message || "Unable to spin right now. Please ask staff to try again.");
        setIsSpinning(false);
        return;
      }
    }

    revealPrize(availablePrizes[pickPrizeIndex(availablePrizes)]);
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
        disabled={isCheckingSpin || isSpinning || hasUsedSpin || !availablePrizes.length}
        onClick={spinWheel}
      >
        {isCheckingSpin ? "Checking spin..." : isSpinning ? "Finding your prize..." : hasUsedSpin ? "Spin used" : selectedPrize ? "Spin for another surprise" : "Tap to spin"}
      </button>

      <div className={`ppp-prize-wheel__result ${selectedPrize ? "has-prize" : ""}`} aria-live="polite">
        {selectedPrize ? (
          <>
            <span className="ppp-prize-wheel__result-stars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <small>{hasUsedSpin ? "Your prize" : "You won"}</small>
            <strong>{selectedPrize}</strong>
          </>
        ) : (
          <p>{oneSpinOnly ? "One spin is available for this lookup." : "Press the button and watch the wheel pick a reward."}</p>
        )}
      </div>

      {spinError ? <p className="ppp-prize-wheel__error">{spinError}</p> : null}

      <div className="ppp-level-prize-grid">
        {availablePrizes.map((reward) => (
          <strong key={reward}>{reward}</strong>
        ))}
      </div>
    </div>
  );
}
