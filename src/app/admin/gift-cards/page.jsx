"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import "../../styles/admin-waivers.css";
import "../../styles/admin-gift-cards.css";

const GIFT_CARD_ADDRESS = "960 Edgeley Blvd #2, Vaughan, ON L4K 4V4";

const PASS_OPTIONS = [
  {
    minutes: 30,
    name: "Explorer Pass",
    tagline: "One focused run through every challenge room.",
    codePrefix: "PPP-30",
    price: "19",
    accent: "#a4cf5f",
    className: "gift-card--explorer",
    badge: "",
    pulse:
      "M0 23 H60 L72 23 L80 8 L88 38 L96 23 H150 L162 23 L170 8 L178 38 L186 23 H240 L252 23 L260 8 L268 38 L276 23 H352",
  },
  {
    minutes: 60,
    name: "All-Access Pass",
    tagline: "The full Pixel Pulse experience across every challenge room.",
    codePrefix: "PPP-60",
    price: "29",
    accent: "#86b84f",
    className: "gift-card--all-access",
    badge: "Most Popular",
    pulse:
      "M0 23 H40 L50 23 L58 4 L66 42 L74 23 H110 L120 23 L128 4 L136 42 L144 23 H180 L190 23 L198 4 L206 42 L214 23 H250 L260 23 L268 4 L276 42 L284 23 H352",
  },
  {
    minutes: 90,
    name: "Booster Pass",
    tagline: "A fully loaded session with extra replay time.",
    codePrefix: "PPP-90",
    price: "38",
    accent: "#f2c94c",
    className: "gift-card--booster",
    badge: "Fully Loaded",
    pulse:
      "M0 23 H24 L32 23 L40 1 L48 45 L56 23 H80 L88 23 L96 1 L104 45 L112 23 H136 L144 23 L152 1 L160 45 L168 23 H192 L200 23 L208 1 L216 45 L224 23 H248 L256 23 L264 1 L272 45 L280 23 H304 L312 23 L320 1 L328 45 L336 23 H352",
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

function loadCardLogo() {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = "/assets/images/logo.png";
  });
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  const corner = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + corner, y);
  ctx.lineTo(x + width - corner, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + corner);
  ctx.lineTo(x + width, y + height - corner);
  ctx.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
  ctx.lineTo(x + corner, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - corner);
  ctx.lineTo(x, y + corner);
  ctx.quadraticCurveTo(x, y, x + corner, y);
  ctx.closePath();
}

function drawLabel(ctx, text, x, y) {
  ctx.fillStyle = "#8b96a8";
  ctx.font = "900 20px Arial";
  ctx.letterSpacing = "3px";
  ctx.fillText(String(text || "").toUpperCase(), x, y);
  ctx.letterSpacing = "0px";
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) lines.push(currentLine);

  lines.slice(0, maxLines).forEach((line, index) => {
    const suffix = index === maxLines - 1 && lines.length > maxLines ? "..." : "";
    ctx.fillText(`${line}${suffix}`, x, y + index * lineHeight);
  });
}

async function renderGiftCardPng(pass, fields) {
  const logo = await loadCardLogo();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const width = 840;
  const height = 1120;
  const padding = 48;
  const accent = pass.accent;
  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = "#080a0e";
  ctx.fillRect(0, 0, width, height);

  roundedRectPath(ctx, padding, padding, width - padding * 2, height - padding * 2, 18);
  ctx.clip();

  const cardGradient = ctx.createLinearGradient(0, padding, 0, height - padding);
  cardGradient.addColorStop(0, "#161c25");
  cardGradient.addColorStop(1, "#10141b");
  ctx.fillStyle = cardGradient;
  ctx.fillRect(padding, padding, width - padding * 2, height - padding * 2);

  const glow = ctx.createRadialGradient(110, 0, 0, 110, 0, 460);
  glow.addColorStop(0, `${accent}33`);
  glow.addColorStop(0.55, `${accent}18`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(padding, padding, width - padding * 2, 440);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let gridX = padding; gridX < width - padding; gridX += 56) {
    ctx.beginPath();
    ctx.moveTo(gridX, padding);
    ctx.lineTo(gridX, height - padding);
    ctx.stroke();
  }
  for (let gridY = padding; gridY < height - padding; gridY += 56) {
    ctx.beginPath();
    ctx.moveTo(padding, gridY);
    ctx.lineTo(width - padding, gridY);
    ctx.stroke();
  }

  ctx.drawImage(logo, padding + 48, padding + 44, 184, 123);

  roundedRectPath(ctx, width - padding - 190, padding + 48, 142, 38, 19);
  ctx.fillStyle = `${accent}1f`;
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = "900 18px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GIFT CARD", width - padding - 119, padding + 73);
  ctx.textAlign = "left";

  drawLabel(ctx, "Session Length", padding + 48, 270);

  ctx.fillStyle = "#f2f5f8";
  ctx.font = "900 188px Arial";
  ctx.fillText(String(pass.minutes), padding + 48, 430);
  ctx.fillStyle = accent;
  ctx.font = "900 42px Arial";
  ctx.fillText("MIN", padding + 48 + ctx.measureText(String(pass.minutes)).width + 16, 426);

  ctx.save();
  ctx.translate(padding + 48, 462);
  ctx.scale(648 / 352, 84 / 46);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D(pass.pulse));
  ctx.restore();

  if (pass.badge) {
    const badgeText = pass.badge.toUpperCase();
    ctx.font = "900 17px Arial";
    const badgeWidth = ctx.measureText(badgeText).width + 34;
    roundedRectPath(ctx, padding + 48, 560, badgeWidth, 38, 8);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.fillStyle = "#050810";
    ctx.fillText(badgeText, padding + 65, 585);
  }

  ctx.fillStyle = "#f2f5f8";
  ctx.font = "900 42px Arial";
  ctx.fillText(pass.name.toUpperCase(), padding + 48, pass.badge ? 650 : 600);

  ctx.fillStyle = "#8b96a8";
  ctx.font = "700 26px Arial";
  drawWrappedText(ctx, pass.tagline, padding + 48, pass.badge ? 698 : 648, 620, 36, 2);

  ctx.setLineDash([14, 12]);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.moveTo(padding, 760);
  ctx.lineTo(width - padding, 760);
  ctx.stroke();
  ctx.setLineDash([]);

  drawLabel(ctx, "From", padding + 48, 820);
  ctx.fillStyle = "#f2f5f8";
  ctx.font = "800 28px Arial";
  ctx.fillText(fields.sender || "Pixel Pulse Friend", padding + 48, 858);

  drawLabel(ctx, "Redemption Code", padding + 48, 930);
  ctx.fillStyle = accent;
  ctx.font = "900 32px Arial";
  ctx.fillText(fields.code || `${pass.codePrefix}-XXXXXX`, padding + 48, 974);

  const bars = [60, 100, 40, 80, 55, 90, 30, 70, 100, 50, 72, 44];
  bars.forEach((barHeight, index) => {
    ctx.fillStyle = accent;
    ctx.fillRect(width - padding - 196 + index * 10, 926 + 68 * (1 - barHeight / 100), 4, 68 * (barHeight / 100));
  });

  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.moveTo(padding, 1034);
  ctx.lineTo(width - padding, 1034);
  ctx.stroke();

  ctx.fillStyle = "#f2f5f8";
  ctx.font = "800 24px Arial";
  ctx.fillText("pixelpulseplay.ca", padding + 48, 1068);
  ctx.fillStyle = "#8b96a8";
  ctx.font = "700 18px Arial";
  ctx.fillText(GIFT_CARD_ADDRESS, padding + 48, 1095);
  ctx.fillStyle = accent;
  ctx.font = "900 42px Arial";
  ctx.textAlign = "right";
  ctx.fillText(money(fields.price), width - padding - 48, 1084);
  ctx.textAlign = "left";

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
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
    <article className={`gift-card ${pass.className}`} style={{ "--accent": pass.accent }}>
      <div className="gift-card__top">
        <div className="gift-card__brand">
          <Image src="/assets/images/logo.png" alt="Pixel Pulse Play" width={118} height={79} />
        </div>
        <span className="gift-card__tag">Gift Card</span>
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
        <svg className="gift-card__pulse" viewBox="0 0 352 46" preserveAspectRatio="none" aria-hidden="true">
          <path d={pass.pulse} />
        </svg>
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
        <div>
          <span>pixelpulseplay.ca</span>
          <small>{GIFT_CARD_ADDRESS}</small>
        </div>
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
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#080a0e;color:#f2f5f8;font-family:Arial,sans-serif;padding:32px}.card{--accent:${pass.accent};width:min(420px,100%);background:radial-gradient(520px 260px at 8% -10%,rgba(164,207,95,.14),transparent 62%),linear-gradient(180deg,#161c25,#10141b);border:1px solid rgba(255,255,255,.1);border-radius:22px;overflow:hidden;box-shadow:0 30px 60px -25px #000;position:relative}.card:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px);background-size:28px 28px;opacity:.28}.inner{position:relative;padding:24px}.top,.stub,.foot,.names{display:flex;justify-content:space-between;gap:16px}.top{position:relative;z-index:1;padding:24px 24px 0}.brand img{display:block;width:92px;height:auto}.accent{color:var(--accent)}.tag{border:1px solid var(--accent);color:var(--accent);background:rgba(164,207,95,.12);border-radius:999px;padding:5px 10px;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}.eyebrow{margin-top:30px;color:#8b96a8;font-size:11px;font-weight:900;letter-spacing:.24em;text-transform:uppercase}.minutes{display:flex;align-items:flex-end;gap:8px;line-height:.8}.minutes strong{font-size:104px}.minutes span{color:var(--accent);font-weight:900;font-size:24px;text-transform:uppercase;padding-bottom:12px}.badge{display:inline-flex;border-radius:5px;background:var(--accent);color:#050810;padding:4px 8px;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.pulse{width:100%;height:46px}.pulse path{fill:none;stroke:var(--accent);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.card h1{margin:8px 0 4px;font-size:24px;text-transform:uppercase}.card p{margin:0;color:#8b96a8;font-size:13px;line-height:1.5}.divider{margin:22px -24px;border-top:1px dashed rgba(255,255,255,.2)}.names div,.stub div,.foot div{display:grid;gap:5px}.names span,.stub span{font-size:10px;color:#8b96a8;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.names strong,.stub strong{font-size:14px}.barcode{display:flex;align-items:flex-end;gap:2px;height:34px}.barcode span{width:2px;background:var(--accent)}.foot{margin:20px -24px -24px;padding:16px 24px;border-top:1px solid rgba(255,255,255,.08)}.foot span{font-size:13px;font-weight:750}.foot small{color:#8b96a8;font-size:10px;font-weight:700;line-height:1.25}.foot strong{color:var(--accent);font-size:24px}
</style>
</head>
<body>
<article class="card">
<div class="top"><div class="brand"><img src="https://www.pixelpulseplay.ca/assets/images/logo.png" alt="Pixel Pulse Play"></div><div class="tag">Gift Card</div></div>
<div class="inner">
<div class="eyebrow">Session Length</div>
<div class="minutes"><strong>${pass.minutes}</strong><span>Min</span></div>
<svg class="pulse" viewBox="0 0 352 46" preserveAspectRatio="none"><path d="${pass.pulse}"/></svg>
${pass.badge ? `<div class="badge">${safeText(pass.badge)}</div>` : ""}
<h1>${safeText(pass.name)}</h1><p>${safeText(pass.tagline)}</p>
<div class="divider"></div>
<div class="names"><div><span>From</span><strong>${safeText(fields.sender || "Pixel Pulse Friend")}</strong></div></div>
<div class="stub" style="margin-top:20px"><div><span>Redemption Code</span><strong class="accent">${safeText(fields.code || `${pass.codePrefix}-XXXXXX`)}</strong></div><div class="barcode">${[60,100,40,80,55,90,30,70,100,50,72,44].map((h) => `<span style="height:${h}%"></span>`).join("")}</div></div>
<div class="foot"><div><span>pixelpulseplay.ca</span><small>${safeText(GIFT_CARD_ADDRESS)}</small></div><strong>${money(fields.price)}</strong></div>
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
  const [deletingCardId, setDeletingCardId] = useState("");
  const [editingCardId, setEditingCardId] = useState("");
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
  const editingGiftCard = giftCards.find((card) => card.id === editingCardId) || null;
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
  const isCurrentCardSaved = Boolean(currentSavedRecord) && (!editingCardId || currentSavedRecord.id === editingCardId);
  const isCurrentCardIssueable = currentSavedRecord?.status === "active";
  const isEditingActiveCard = Boolean(editingGiftCard && editingGiftCard.status === "active");
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

  function editGiftCard(card) {
    if (card.status !== "active") {
      setError("Only active gift cards can be edited.");
      return;
    }

    const minutes = Number(card.durationMinutes);
    setSelectedMinutes(minutes);
    setEditingCardId(card.id);
    setStatus(`Editing ${card.code}.`);
    setError("");
    setFieldsByMinutes((current) => ({
      ...current,
      [minutes]: {
        ...(current[minutes] || {}),
        price: card.price,
        sender: card.senderName || "",
        code: card.code,
      },
    }));
  }

  function cancelEdit() {
    setEditingCardId("");
    setStatus("");
    setError("");
  }

  async function saveGiftCard() {
    setSavingCard(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/admin/gift-cards", {
        method: editingCardId ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingCardId
            ? {
                action: "update",
                id: editingCardId,
                currentCode: editingGiftCard?.code || "",
                code: fields.code,
                durationMinutes: selectedPass.minutes,
                price: fields.price,
                senderName: fields.sender,
              }
            : {
                code: fields.code,
                durationMinutes: selectedPass.minutes,
                price: fields.price,
                senderName: fields.sender,
              },
        ),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to save gift card.");
        return;
      }

      const giftCard = data.giftCard;
      setEditingCardId(giftCard.id);
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
      setStatus(editingCardId ? "Gift card updated." : "Gift card saved and ready to issue.");
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
      if (editingCardId === giftCard.id) setEditingCardId("");
      setRedeemCode("");
      setStatus(`${giftCard.code} redeemed for ${giftCard.durationMinutes} minutes.`);
    } catch (redeemError) {
      setError("Unable to redeem gift card.");
    } finally {
      setRedeemingCard(false);
    }
  }

  async function deleteGiftCard(card) {
    if (card.status !== "redeemed") {
      setError("Only redeemed gift cards can be deleted.");
      return;
    }
    if (!window.confirm(`Delete redeemed gift card ${card.code}?`)) return;

    setDeletingCardId(card.id);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/admin/gift-cards", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: card.id, code: card.code }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to delete gift card.");
        if (data.giftCard) {
          setGiftCards((current) => current.map((giftCard) => (giftCard.id === data.giftCard.id ? data.giftCard : giftCard)));
        }
        return;
      }

      setGiftCards((current) => current.filter((giftCard) => giftCard.id !== data.giftCard.id));
      if (editingCardId === data.giftCard.id) setEditingCardId("");
      setStatus(`${data.giftCard.code} deleted.`);
    } catch (deleteError) {
      setError("Unable to delete gift card.");
    } finally {
      setDeletingCardId("");
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

  async function downloadImage() {
    setStatus("");
    setError("");

    try {
      const blob = await renderGiftCardPng(selectedPass, fields);
      if (!blob) {
        setError("Unable to create gift card image.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pixel-pulse-gift-card-${selectedPass.minutes}-min.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus("Gift card image downloaded.");
    } catch (imageError) {
      setError("Unable to create gift card image.");
    }
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
            {editingCardId ? (
              <p className="gift-admin__notice">Editing an active saved gift card. Update to save changes, or cancel to create a new card.</p>
            ) : null}
            {!isCurrentCardSaved ? (
              <p className="gift-admin__notice">Save this card before printing or sharing so the redemption code is tracked.</p>
            ) : currentSavedRecord?.status === "redeemed" ? (
              <p className="gift-admin__notice gift-admin__notice--redeemed">This code is already redeemed.</p>
            ) : null}

            <div className="gift-admin__actions">
              <button type="button" onClick={saveGiftCard} disabled={savingCard || isCurrentCardSaved || (editingCardId && !isEditingActiveCard)}>
                {savingCard ? "Saving..." : editingCardId ? (isCurrentCardSaved ? "Saved" : "Update Gift Card") : "Save Gift Card"}
              </button>
              {editingCardId ? (
                <button type="button" className="gift-admin__secondary" onClick={cancelEdit}>
                  Cancel Edit
                </button>
              ) : null}
              <button type="button" className="gift-admin__secondary" onClick={() => window.print()} disabled={!isCurrentCardIssueable}>
                Print
              </button>
              <button type="button" className="gift-admin__secondary" onClick={downloadCard} disabled={!isCurrentCardIssueable}>
                Download HTML
              </button>
              <button type="button" className="gift-admin__secondary" onClick={downloadImage} disabled={!isCurrentCardIssueable}>
                Download PNG
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
                  <th>Actions</th>
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
                      <td>
                        <div className="gift-admin__row-actions">
                          {card.status === "active" ? (
                            <button type="button" onClick={() => editGiftCard(card)}>
                              Edit
                            </button>
                          ) : null}
                          {card.status === "redeemed" ? (
                            <button
                              type="button"
                              className="gift-admin__danger"
                              onClick={() => deleteGiftCard(card)}
                              disabled={deletingCardId === card.id}
                            >
                              {deletingCardId === card.id ? "Deleting..." : "Delete"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8}>{loadingCards ? "Loading gift cards..." : "No gift cards saved yet."}</td>
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
