"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import "../../styles/admin-waivers.css";
import "../../styles/admin-gift-cards.css";

const PASS_OPTIONS = [
  {
    minutes: 30,
    name: "30 Minute Play Pass",
    tagline: "One focused run through every challenge room.",
    codePrefix: "PPP-30",
    price: "19",
    badge: "",
  },
  {
    minutes: 60,
    name: "60 Minute Play Pass",
    tagline: "The full Pixel Pulse experience across every challenge room.",
    codePrefix: "PPP-60",
    price: "29",
    badge: "Most Popular",
  },
  {
    minutes: 90,
    name: "90 Minute Play Pass",
    tagline: "A fully loaded session with extra replay time.",
    codePrefix: "PPP-90",
    price: "38",
    badge: "Fully Loaded",
  },
];

function randomCode(prefix) {
  const suffix =
    typeof crypto !== "undefined" && crypto.getRandomValues
      ? Array.from(crypto.getRandomValues(new Uint8Array(3)))
          .map((value) => value.toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase()
      : Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${suffix}`;
}

function money(value) {
  const cleaned = String(value || "").replace(/[^\d.]/g, "");
  if (!cleaned) return "$0";
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) return `$${cleaned}`;
  return `$${amount.toLocaleString("en-CA", { maximumFractionDigits: 2 })}`;
}

function normalizeCode(value = "") {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function priceCents(value) {
  const cleaned = String(value || "").replace(/[^\d.]/g, "");
  if (!cleaned) return 0;
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? Math.round(amount * 100) : -1;
}

function shortDate(value = "") {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value).slice(0, 10)
    : date.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

function safeText(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function Barcode() {
  const bars = [60, 100, 40, 80, 55, 90, 30, 70, 100, 50, 72, 44];
  return (
    <div className="gift-card__barcode" aria-hidden="true">
      {bars.map((height, index) => (
        <span style={{ height: `${height}%` }} key={`${height}-${index}`} />
      ))}
    </div>
  );
}

function GiftCardPreview({ pass, fields }) {
  return (
    <article className="gift-card">
      <div className="gift-card__top">
        <div className="gift-card__brand">
          <Image src="/assets/images/logo.png" alt="Pixel Pulse Play" width={118} height={79} />
        </div>
        <span className="gift-card__tag">Digital Gift Card</span>
      </div>

      <div className="gift-card__hero">
        <div className="gift-card__eyebrow-row">
          <span>Session Length</span>
          {pass.badge ? <b>{pass.badge}</b> : null}
        </div>
        <div className="gift-card__minutes">
          <strong>{pass.minutes}</strong>
          <span>Min</span>
        </div>
        <h2>{pass.name}</h2>
        <p>{pass.tagline}</p>
      </div>

      <div className="gift-card__divider" />

      <div className="gift-card__names">
        <div>
          <span>From</span>
          <strong>{fields.sender || "Pixel Pulse Friend"}</strong>
        </div>
      </div>

      <div className="gift-card__stub">
        <div>
          <span>Redemption Code</span>
          <strong>{fields.code || `${pass.codePrefix}-XXXXXX`}</strong>
        </div>
        <Barcode />
      </div>

      <div className="gift-card__foot">
        <span>pixelpulseplay.ca</span>
        <strong>{money(fields.price)}</strong>
      </div>
    </article>
  );
}

function standaloneHtml(pass, fields) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pixel Pulse Play Gift Card - ${pass.minutes} Min</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f2f4f7;color:#101828;font-family:Arial,sans-serif;padding:32px}.card{width:min(420px,100%);background:#fff;border:1px solid #d0d5dd;border-radius:8px;overflow:hidden;box-shadow:0 24px 50px -30px rgba(15,23,42,.35)}.top{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px;background:#050810}.brand img{display:block;width:118px;height:auto}.tag{border:1px solid #a4cf5f;color:#a4cf5f;border-radius:999px;padding:5px 10px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.14em;white-space:nowrap}.inner{padding:24px}.stub,.foot,.names{display:flex;justify-content:space-between;gap:16px}.eyebrow{color:#667085;font-size:11px;font-weight:900;letter-spacing:.22em;text-transform:uppercase}.minutes{display:flex;align-items:flex-end;gap:8px;margin-top:8px;line-height:.8}.minutes strong{font-size:104px;color:#101828}.minutes span{color:#027a48;font-weight:900;font-size:24px;text-transform:uppercase;padding-bottom:12px}.badge{align-self:flex-start;border-radius:5px;background:#ecfdf3;color:#027a48;padding:4px 8px;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.card h1{margin:14px 0 4px;font-size:24px;text-transform:uppercase}.card p{margin:0;color:#667085;font-size:13px;line-height:1.5}.divider{margin:22px -24px;border-top:1px dashed #d0d5dd}.names div,.stub div{display:grid;gap:5px}.names span,.stub span{font-size:10px;color:#667085;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.names strong,.stub strong{font-size:14px}.accent{color:#027a48}.barcode{display:flex;align-items:flex-end;gap:2px;height:34px}.barcode span{width:2px;background:#101828}.foot{margin:20px -24px -24px;padding:16px 24px;border-top:1px solid #eaecf0;background:#f9fafb}.foot strong{color:#027a48;font-size:24px}
</style>
</head>
<body>
<article class="card">
<div class="top"><div class="brand"><img src="https://www.pixelpulseplay.ca/assets/images/logo.png" alt="Pixel Pulse Play"></div><div class="tag">Digital Gift Card</div></div>
<div class="inner">
<div class="eyebrow">Session Length</div>
<div class="minutes"><strong>${pass.minutes}</strong><span>Min</span></div>
${pass.badge ? `<div class="badge">${safeText(pass.badge)}</div>` : ""}
<h1>${safeText(pass.name)}</h1><p>${safeText(pass.tagline)}</p>
<div class="divider"></div>
<div class="names"><div><span>From</span><strong>${safeText(fields.sender || "Pixel Pulse Friend")}</strong></div></div>
<div class="stub" style="margin-top:20px"><div><span>Redemption Code</span><strong class="accent">${safeText(fields.code || `${pass.codePrefix}-XXXXXX`)}</strong></div><div class="barcode">${[60,100,40,80,55,90,30,70,100,50,72,44].map((h) => `<span style="height:${h}%"></span>`).join("")}</div></div>
<div class="foot"><span>pixelpulseplay.ca</span><strong>${money(fields.price)}</strong></div>
</div></article>
</body>
</html>`;
}

export default function AdminGiftCardsPage() {
  const [selectedMinutes, setSelectedMinutes] = useState(60);
  const [giftCards, setGiftCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [savingCard, setSavingCard] = useState(false);
  const [redeemingCard, setRedeemingCard] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const selectedPass = PASS_OPTIONS.find((pass) => pass.minutes === selectedMinutes) || PASS_OPTIONS[1];
  const [fieldsByMinutes, setFieldsByMinutes] = useState(() =>
    Object.fromEntries(
      PASS_OPTIONS.map((pass) => [
        pass.minutes,
        {
          price: pass.price,
          sender: "",
          code: randomCode(pass.codePrefix),
        },
      ]),
    ),
  );

  const fields = fieldsByMinutes[selectedPass.minutes];
  const normalizedCurrentCode = normalizeCode(fields.code);
  const currentSavedRecord = useMemo(
    () =>
      giftCards.find(
        (card) =>
          card.code === normalizedCurrentCode &&
          Number(card.durationMinutes) === selectedPass.minutes &&
          Number(card.priceCents) === priceCents(fields.price) &&
          String(card.senderName || "") === String(fields.sender || "").trim(),
      ),
    [fields.price, fields.sender, giftCards, normalizedCurrentCode, selectedPass.minutes],
  );
  const isCurrentCardSaved = Boolean(currentSavedRecord);
  const isCurrentCardIssueable = currentSavedRecord?.status === "active";
  const allCards = useMemo(
    () => PASS_OPTIONS.map((pass) => ({ pass, fields: fieldsByMinutes[pass.minutes] })),
    [fieldsByMinutes],
  );

  async function loadGiftCards() {
    setLoadingCards(true);
    setError("");

    try {
      const response = await fetch("/api/admin/gift-cards?limit=200", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to load gift cards.");
        return;
      }

      setGiftCards(data.giftCards || []);
    } catch (loadError) {
      setError("Unable to load gift cards.");
    } finally {
      setLoadingCards(false);
    }
  }

  useEffect(() => {
    loadGiftCards();
  }, []);

  function updateField(name, value) {
    setStatus("");
    setError("");
    setFieldsByMinutes((current) => ({
      ...current,
      [selectedPass.minutes]: {
        ...current[selectedPass.minutes],
        [name]: value,
      },
    }));
  }

  function regenerateCode() {
    updateField("code", randomCode(selectedPass.codePrefix));
  }

  async function saveGiftCard() {
    setSavingCard(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/admin/gift-cards", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: fields.code,
          durationMinutes: selectedPass.minutes,
          price: fields.price,
          senderName: fields.sender,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to save gift card.");
        return;
      }

      const giftCard = data.giftCard;
      setFieldsByMinutes((current) => ({
        ...current,
        [selectedPass.minutes]: {
          ...current[selectedPass.minutes],
          code: giftCard.code,
          price: giftCard.price,
          sender: giftCard.senderName || "",
        },
      }));
      setGiftCards((current) => [giftCard, ...current.filter((card) => card.id !== giftCard.id)]);
      setStatus("Gift card saved and ready to issue.");
    } catch (saveError) {
      setError("Unable to save gift card.");
    } finally {
      setSavingCard(false);
    }
  }

  async function redeemGiftCard(event) {
    event.preventDefault();
    setRedeemingCard(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/admin/gift-cards", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem", code: redeemCode }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to redeem gift card.");
        if (data.giftCard) {
          setGiftCards((current) => current.map((card) => (card.id === data.giftCard.id ? data.giftCard : card)));
        }
        return;
      }

      const giftCard = data.giftCard;
      setGiftCards((current) => current.map((card) => (card.id === giftCard.id ? giftCard : card)));
      setRedeemCode("");
      setStatus(`${giftCard.code} redeemed for ${giftCard.durationMinutes} minutes.`);
    } catch (redeemError) {
      setError("Unable to redeem gift card.");
    } finally {
      setRedeemingCard(false);
    }
  }

  function downloadCard() {
    const html = standaloneHtml(selectedPass, fields);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pixel-pulse-gift-card-${selectedPass.minutes}-min.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell>
      <div className="gift-admin">
        <header className="waiver-admin-header waiver-admin-header--dashboard gift-admin__header">
          <div>
            <span className="waiver-admin-kicker">Admin dashboard</span>
            <h1>Digital Gift Cards</h1>
            <p>Create 30, 60, and 90 minute gameplay gift cards with custom pricing and redemption codes.</p>
          </div>
        </header>

        <section className="gift-admin__layout">
          <form className="gift-admin__panel" onSubmit={(event) => event.preventDefault()}>
            <div className="gift-admin__section-head">
              <h2>Card Details</h2>
              <span>{selectedPass.name}</span>
            </div>

            <div className="gift-admin__segmented" role="tablist" aria-label="Gift card duration">
              {PASS_OPTIONS.map((pass) => (
                <button
                  type="button"
                  className={pass.minutes === selectedMinutes ? "is-active" : ""}
                  onClick={() => setSelectedMinutes(pass.minutes)}
                  key={pass.minutes}
                >
                  {pass.minutes} min
                </button>
              ))}
            </div>

            <label>
              <span>Cost</span>
              <input
                inputMode="decimal"
                value={fields.price}
                onChange={(event) => updateField("price", event.target.value)}
                placeholder="29"
              />
            </label>

            <label>
              <span>From</span>
              <input
                value={fields.sender}
                onChange={(event) => updateField("sender", event.target.value)}
                placeholder="Purchaser name"
              />
            </label>

            <label>
              <span>Redemption code</span>
              <div className="gift-admin__code-row">
                <input value={fields.code} onChange={(event) => updateField("code", event.target.value.toUpperCase())} />
                <button type="button" onClick={regenerateCode}>New</button>
              </div>
            </label>

            {error ? <p className="gift-admin__error">{error}</p> : null}
            {status ? <p className="gift-admin__status">{status}</p> : null}
            {!isCurrentCardSaved ? (
              <p className="gift-admin__notice">Save this card before printing or sharing so the redemption code is tracked.</p>
            ) : currentSavedRecord?.status === "redeemed" ? (
              <p className="gift-admin__notice gift-admin__notice--redeemed">This code is already redeemed.</p>
            ) : null}

            <div className="gift-admin__actions">
              <button type="button" onClick={saveGiftCard} disabled={savingCard || isCurrentCardSaved}>
                {savingCard ? "Saving..." : isCurrentCardSaved ? "Saved" : "Save Gift Card"}
              </button>
              <button type="button" className="gift-admin__secondary" onClick={() => window.print()} disabled={!isCurrentCardIssueable}>
                Print
              </button>
              <button type="button" className="gift-admin__secondary" onClick={downloadCard} disabled={!isCurrentCardIssueable}>
                Download HTML
              </button>
            </div>
          </form>

          <div className="gift-admin__preview" aria-label="Selected gift card preview">
            <GiftCardPreview pass={selectedPass} fields={fields} />
          </div>
        </section>

        <section className="gift-admin__redeem">
          <form className="gift-admin__panel" onSubmit={redeemGiftCard}>
            <div className="gift-admin__section-head">
              <h2>Redeem Gift Card</h2>
              <span>One-time use</span>
            </div>
            <label>
              <span>Redemption code</span>
              <input
                value={redeemCode}
                onChange={(event) => setRedeemCode(event.target.value.toUpperCase())}
                placeholder="PPP-60-ABC123"
              />
            </label>
            <div className="gift-admin__actions">
              <button type="submit" disabled={redeemingCard || !redeemCode.trim()}>
                {redeemingCard ? "Redeeming..." : "Redeem Code"}
              </button>
            </div>
          </form>
        </section>

        <section className="gift-admin__deck" aria-label="All gift card options">
          <div className="gift-admin__section-head">
            <h2>All Durations</h2>
            <span>Prices stay editable per card</span>
          </div>
          <div className="gift-admin__cards">
            {allCards.map(({ pass, fields: cardFields }) => (
              <GiftCardPreview pass={pass} fields={cardFields} key={pass.minutes} />
            ))}
          </div>
        </section>

        <section className="gift-admin__records">
          <div className="gift-admin__section-head">
            <h2>Gift Card Records</h2>
            <button type="button" onClick={loadGiftCards} disabled={loadingCards}>
              {loadingCards ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <div className="gift-admin__table-wrap">
            <table className="gift-admin__table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Duration</th>
                  <th>Cost</th>
                  <th>Issued By</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Redeemed</th>
                </tr>
              </thead>
              <tbody>
                {giftCards.length ? (
                  giftCards.map((card) => (
                    <tr key={card.id}>
                      <td>{card.code}</td>
                      <td>{card.durationMinutes} min</td>
                      <td>{money(card.price)}</td>
                      <td>{card.senderName || "—"}</td>
                      <td><span className={`gift-admin__pill gift-admin__pill--${card.status}`}>{card.status}</span></td>
                      <td>{shortDate(card.createdAt) || "—"}</td>
                      <td>{shortDate(card.redeemedAt) || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>{loadingCards ? "Loading gift cards..." : "No gift cards saved yet."}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
