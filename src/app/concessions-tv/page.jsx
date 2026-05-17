import Image from "next/image";
import "../styles/concessions-tv.css";
import { fetchsheetdata } from "@/lib/sheets";
import { getConfiguredValue, getRowValue } from "@/lib/ctaContent";
import { canonicalUrl } from "@/lib/seo";

const LOCATION_SLUG = "vaughan";
const CONCESSIONS_SHEET = "concessions";
const LOGO = "/assets/images/logoD.png";

const fallbackItems = [
  { category: "Drinks", name: "Water", price: "1.50", emoji: "💧", accent: "cyan", sort: 10 },
  { category: "Drinks", name: "Coke", price: "1.99", emoji: "🥤", accent: "orange", sort: 20 },
  { category: "Drinks", name: "Canada Dry", price: "1.99", emoji: "🍋", accent: "cyan", sort: 30 },
  { category: "Drinks", name: "Fuze Ice Tea", price: "1.99", emoji: "🧊", accent: "green", sort: 40 },
  { category: "Drinks", name: "Crush", price: "1.99", emoji: "🍊", accent: "orange", sort: 50 },
  { category: "Drinks", name: "Juice", price: "1.99", emoji: "🧃", accent: "cyan", sort: 60 },
  { category: "Snacks", name: "Chips", price: "1.99", emoji: "🍟", accent: "orange", sort: 70 },
  { category: "Snacks", name: "Rice Crispies", price: "1.49", emoji: "🍚", accent: "cyan", sort: 80 },
  { category: "Snacks", name: "Lollipop", price: "0.99", emoji: "🍭", accent: "green", sort: 90 },
  { category: "Snacks", name: "Chocolate", price: "1.50", emoji: "🍫", accent: "orange", sort: 100 },
];

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Concessions TV | Pixel Pulse Play",
  description: "Pixel Pulse Play concession menu display.",
  alternates: {
    canonical: canonicalUrl("/concessions-tv"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

async function getConcessionRows() {
  try {
    const rows = await fetchsheetdata(CONCESSIONS_SHEET, LOCATION_SLUG);
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.error("concessions sheet failed:", error);
    return [];
  }
}

function isHidden(row = {}) {
  const value = getRowValue(row, ["available", "active", "enabled", "show"]);
  return ["false", "no", "0", "hidden", "inactive"].includes(value.toLowerCase());
}

function normalizeAccent(value = "", index = 0) {
  const accent = String(value || "").trim().toLowerCase();
  const allowed = new Set(["cyan", "green", "orange", "pink"]);

  if (allowed.has(accent)) {
    return accent;
  }

  return ["cyan", "orange", "green", "cyan"][index % 4];
}

function formatPrice(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("$")) return raw;

  const amount = Number(raw.replace(/[^0-9.]/g, ""));
  if (Number.isFinite(amount)) {
    return `$${amount.toFixed(2)}`;
  }

  return raw;
}

function normalizeItems(rows = []) {
  const sheetItems = rows
    .filter((row) => getRowValue(row, ["name", "item", "title"]) && !isHidden(row))
    .map((row, index) => ({
      category: getRowValue(row, ["category", "section", "group"]) || "Concessions",
      name: getRowValue(row, ["name", "item", "title"]),
      price: formatPrice(getRowValue(row, ["price", "amount", "cost"])),
      emoji: getRowValue(row, ["emoji", "icon", "image"]) || "✦",
      accent: normalizeAccent(getRowValue(row, ["accent", "color", "theme"]), index),
      sort: Number(getRowValue(row, ["sort", "order", "position"]) || index + 1),
    }))
    .sort((a, b) => a.sort - b.sort);

  return sheetItems.length
    ? sheetItems
    : fallbackItems.map((item, index) => ({
        ...item,
        price: formatPrice(item.price),
        accent: normalizeAccent(item.accent, index),
      }));
}

function groupItems(items = []) {
  return items.reduce((groups, item) => {
    const group = groups.find((entry) => entry.title === item.category);
    if (group) {
      group.items.push(item);
    } else {
      groups.push({ title: item.category, items: [item] });
    }

    return groups;
  }, []);
}

function getVideoType(value = "") {
  const source = String(value || "").split("?")[0].toLowerCase();

  if (source.endsWith(".webm")) {
    return "video/webm";
  }

  if (source.endsWith(".ogg") || source.endsWith(".ogv")) {
    return "video/ogg";
  }

  return "video/mp4";
}

export default async function ConcessionsTvPage() {
  const rows = await getConcessionRows();
  const items = normalizeItems(rows);
  const groups = groupItems(items);
  const title = getConfiguredValue(rows, ["screenTitle", "concessionsTitle"], "Concessions");
  const subtitle = getConfiguredValue(rows, ["screenSubtitle", "concessionsSubtitle"], "Fuel up. Play on");
  const footer = getConfiguredValue(rows, ["screenFooter", "concessionsFooter"], "Cash & card welcome • pixelpulseplay.ca • Vaughan, ON");
  const taxNote = getConfiguredValue(rows, ["taxNote", "screenTaxNote", "concessionsTaxNote"], "Prices subject to 13% HST/GST");
  const heroVideo = getConfiguredValue(rows, ["heroVideo", "backgroundVideo", "screenVideo"], "");
  const heroVideoPoster = getConfiguredValue(rows, ["heroVideoPoster", "backgroundVideoPoster", "screenVideoPoster"], "");

  return (
    <main className="ppp-concessions-tv" aria-label="Pixel Pulse concession menu">
      {heroVideo ? (
        <video
          className="ppp-concessions-bg-video"
          autoPlay
          muted
          loop
          playsInline
          poster={heroVideoPoster || undefined}
          aria-hidden="true"
        >
          <source src={heroVideo} type={getVideoType(heroVideo)} />
        </video>
      ) : null}
      <div className="ppp-concessions-video-scrim" aria-hidden="true" />
      <div className="ppp-concessions-corner ppp-concessions-corner--tl" />
      <div className="ppp-concessions-corner ppp-concessions-corner--tr" />
      <div className="ppp-concessions-corner ppp-concessions-corner--bl" />
      <div className="ppp-concessions-corner ppp-concessions-corner--br" />

      <section className="ppp-concessions-board">
        <header className="ppp-concessions-header">
          <Image className="ppp-concessions-logo" src={LOGO} width={210} height={92} alt="Pixel Pulse Play" priority />
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </header>

        <div className="ppp-concessions-menu">
          {groups.map((group) => (
            <section className="ppp-concessions-section" key={group.title}>
              <div className="ppp-concessions-section-title">
                <span>{group.title}</span>
              </div>
              <div className="ppp-concessions-grid" data-count={group.items.length}>
                {group.items.map((item) => (
                  <article className={`ppp-concessions-card is-${item.accent}`} key={`${group.title}-${item.name}`}>
                    <div className="ppp-concessions-icon" aria-hidden="true">
                      {item.emoji}
                    </div>
                    <h2>{item.name}</h2>
                    {item.price ? <strong>{item.price}</strong> : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <footer className="ppp-concessions-footer">
        <span>{footer}</span>
        {taxNote ? <strong>{taxNote}</strong> : null}
      </footer>
    </main>
  );
}
