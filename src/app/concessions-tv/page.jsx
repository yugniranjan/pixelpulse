import Image from "next/image";
import "../styles/concessions-tv.css";
import { fetchsheetdata } from "@/lib/sheets";
import { getConfiguredValue, getRowValue } from "@/lib/ctaContent";
import { canonicalUrl } from "@/lib/seo";

const LOCATION_SLUG = "vaughan";
const CONCESSION_SHEETS = ["consession", "concessions"];
const LOGO = "/assets/images/logoD.png";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Recharge Bar TV | Pixel Pulse Play",
  description: "Pixel Pulse Play Recharge Bar menu display.",
  alternates: {
    canonical: canonicalUrl("/concessions-tv"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

async function getConcessionRows() {
  for (const sheetName of CONCESSION_SHEETS) {
    try {
      const rows = await fetchsheetdata(sheetName, LOCATION_SLUG);

      if (Array.isArray(rows) && rows.length) {
        return rows;
      }
    } catch (error) {
      console.error(`${sheetName} sheet failed:`, error);
    }
  }

  return [];
}

function isHidden(row = {}) {
  const value = getRowValue(row, ["available", "active", "enabled", "show"]);
  return ["false", "no", "0", "hidden", "inactive"].includes(value.toLowerCase());
}

function isConfigRow(row = {}) {
  return Boolean(getRowValue(row, "key"));
}

function isTaxNoteRow(row = {}) {
  const values = [
    getRowValue(row, ["name", "item", "title"]),
    getRowValue(row, ["value", "description", "note"]),
    getRowValue(row, ["category", "section", "group"]),
  ].join(" ");

  return /hst|gst/i.test(values);
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

function normalizeImageUrl(value = "") {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  if (raw.startsWith("/")) {
    return raw;
  }

  try {
    const url = new URL(raw);

    if (["http:", "https:"].includes(url.protocol)) {
      return url.toString();
    }
  } catch {
    return "";
  }

  return "";
}

function normalizeIconFields(row = {}) {
  const imageUrl = normalizeImageUrl(
    getRowValue(row, [
      "imageUrl",
      "imageURL",
      "image_url",
      "photoUrl",
      "photoURL",
      "photo_url",
      "image",
      "icon",
    ]),
  );

  if (imageUrl) {
    return {
      emoji: getRowValue(row, ["emoji"]),
      imageUrl,
    };
  }

  return {
    emoji: getRowValue(row, ["emoji", "icon", "image"]),
    imageUrl: "",
  };
}

function normalizeItems(rows = []) {
  const sheetItems = rows
    .filter(
      (row) =>
        getRowValue(row, ["name", "item", "title"]) &&
        !isHidden(row) &&
        !isConfigRow(row) &&
        !isTaxNoteRow(row),
    )
    .map((row, index) => {
      const iconFields = normalizeIconFields(row);

      return {
        category: getRowValue(row, ["category", "section", "group"]) || "Concessions",
        name: getRowValue(row, ["name", "item", "title"]),
        price: formatPrice(getRowValue(row, ["price", "amount", "cost"])),
        emoji: iconFields.emoji,
        imageUrl: iconFields.imageUrl,
        accent: normalizeAccent(getRowValue(row, ["accent", "color", "theme"]), index),
        sort: Number(getRowValue(row, ["sort", "order", "position"]) || index + 1),
      };
    })
    .sort((a, b) => a.sort - b.sort);

  return sheetItems;
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

function normalizeScreenTitle(value = "") {
  const title = String(value || "").trim();

  if (!title || /concessions?/i.test(title)) {
    return "Recharge Bar";
  }

  return title;
}

function getGroupTone(title = "", index = 0) {
  const normalized = title.toLowerCase();

  if (/drink|beverage|pop|soda|water|juice/.test(normalized)) {
    return "drinks";
  }

  if (/snack|chip|candy|chocolate|treat|food/.test(normalized)) {
    return "snacks";
  }

  return ["drinks", "snacks", "treats"][index % 3];
}

function getGroupIcon(title = "", tone = "") {
  const normalized = title.toLowerCase();

  if (/drink|beverage|pop|soda|water|juice/.test(normalized) || tone === "drinks") {
    return "🥤";
  }

  if (/snack|chip|candy|chocolate|treat|food/.test(normalized) || tone === "snacks") {
    return "🍿";
  }

  return "⚡";
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
  const title = normalizeScreenTitle(getConfiguredValue(rows, ["screenTitle", "concessionsTitle"], "Recharge Bar"));
  const subtitle = getConfiguredValue(rows, ["screenSubtitle", "concessionsSubtitle"], "Fuel up · Play on · Level up");
  const footer = getConfiguredValue(rows, ["screenFooter", "concessionsFooter"], "Cash & card welcome • pixelpulseplay.ca • Vaughan, ON");
  const taxNote = getConfiguredValue(rows, ["taxNote", "screenTaxNote", "concessionsTaxNote"], "Prices subject to 13% HST/GST");
  const shouldShowTaxNote = taxNote && !/hst|gst/i.test(footer);
  const heroVideo = getConfiguredValue(rows, ["heroVideo", "backgroundVideo", "screenVideo"], "");
  const heroVideoPoster = getConfiguredValue(rows, ["heroVideoPoster", "backgroundVideoPoster", "screenVideoPoster"], "");

  return (
    <main className="ppp-concessions-tv" aria-label="Pixel Pulse Recharge Bar menu">
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

      <section className="ppp-concessions-board">
        <header className="ppp-concessions-header">
          <div className="ppp-concessions-brand">
            <Image className="ppp-concessions-logo" src={LOGO} width={210} height={92} alt="Pixel Pulse Play" priority />
          </div>

          <div className="ppp-concessions-title-block">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="ppp-concessions-status">
            <strong>Open</strong>
            {taxNote ? <span>{taxNote}</span> : null}
          </div>
        </header>

        <div className="ppp-concessions-ticker" aria-hidden="true">
          <div className="ppp-concessions-ticker-track">
            <span>Cash & card accepted at the counter</span>
            <i>◆</i>
            <span>Recharge between rounds</span>
            <i>◆</i>
            <span>Private parties & group events available</span>
            <i>◆</i>
            <span>pixelpulseplay.ca</span>
            <i>◆</i>
            <span>Cash & card accepted at the counter</span>
            <i>◆</i>
            <span>Recharge between rounds</span>
            <i>◆</i>
            <span>Private parties & group events available</span>
            <i>◆</i>
            <span>pixelpulseplay.ca</span>
            <i>◆</i>
          </div>
        </div>

        <div className="ppp-concessions-menu" style={{ "--section-count": groups.length }}>
          {groups.map((group, groupIndex) => {
            const tone = getGroupTone(group.title, groupIndex);

            return (
              <section className={`ppp-concessions-section is-${tone}`} key={group.title}>
                <div className="ppp-concessions-section-title">
                  <span aria-hidden="true">{getGroupIcon(group.title, tone)}</span>
                  <div>
                    <h2>{group.title}</h2>
                    <p>
                      {group.items.length} {group.items.length === 1 ? "choice" : "choices"}
                    </p>
                  </div>
                </div>

                <div className="ppp-concessions-grid" data-count={group.items.length}>
                  {group.items.map((item) => (
                    <article className={`ppp-concessions-card is-${item.accent}`} key={`${group.title}-${item.name}`}>
                      {item.imageUrl || item.emoji ? (
                        <div className="ppp-concessions-icon" aria-hidden="true">
                          {item.imageUrl ? (
                            <span
                              className="ppp-concessions-item-image"
                              style={{ backgroundImage: `url("${item.imageUrl.replaceAll('"', "%22")}")` }}
                            />
                          ) : (
                            item.emoji
                          )}
                        </div>
                      ) : null}
                      <h3>{item.name}</h3>
                      {item.price ? <strong>{item.price}</strong> : null}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="ppp-concessions-footer">
          <div className="ppp-concessions-payments" aria-hidden="true">
            <span>💳 Cash & Card</span>
          </div>
          <span>{footer}</span>
          {shouldShowTaxNote ? <strong>{taxNote}</strong> : null}
        </footer>
      </section>
    </main>
  );
}
