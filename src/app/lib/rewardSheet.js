const DEFAULT_SPREADSHEET_ID = "1NEovNJVBVY4LyXWg3nHFh5-LekMt8GfL4y4eaNz7X1I";
const DEFAULT_SHEET_TAB = "Rewards";
const DEFAULT_CACHE_TTL_MS = 60_000;

let cachedConfig = null;
let cachedAt = 0;
let pendingRequest = null;

function parseCsv(csv = "") {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (quoted) {
      if (character === '"' && csv[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (value || row.length) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows;
}

function asNumber(value, fallback = 0) {
  const number = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(number) ? number : fallback;
}

function isEnabled(value) {
  return !["false", "no", "0", "off"].includes(String(value || "").trim().toLowerCase());
}

function bySortOrder(left, right) {
  return asNumber(left.sort_order, 999) - asNumber(right.sort_order, 999);
}

function rowsToObjects(csv) {
  const parsed = parseCsv(csv);
  const headers = (parsed.shift() || []).map((header) => String(header || "").trim());

  return parsed
    .map((values) => Object.fromEntries(
      headers
        .map((header, index) => [header, values[index] ?? ""])
        .filter(([header]) => Boolean(header)),
    ))
    .filter((row) => row.section && row.key && isEnabled(row.enabled));
}

function buildConfig(rows) {
  const section = (name) => rows.filter((row) => row.section === name).sort(bySortOrder);
  const pageCopy = Object.fromEntries(section("page").map((row) => [row.key, row]));

  return {
    pageCopy,
    heroStats: section("hero_stat").map((row) => ({ label: row.label, value: row.value })),
    howSteps: section("how_step").map((row) => ({
      number: row.label,
      title: row.title,
      text: row.text,
      accent: row.detail,
    })),
    rewardLadder: section("reward").map((row) => ({
      level: row.label,
      levelNumber: asNumber(row.sort_order),
      thresholdPoints: asNumber(row.threshold_points),
      threshold: `${new Intl.NumberFormat("en-US").format(asNumber(row.threshold_points))} PulsePoints`,
      reward: row.title,
      detail: row.text,
      rewardType: row.reward_type,
      icon: row.icon,
    })).filter((reward) => reward.levelNumber > 0 && reward.thresholdPoints > 0 && reward.reward),
    vipBenefits: section("vip_benefit").map((row) => row.value).filter(Boolean),
    prizeWheelRewards: section("prize").map((row) => row.value).filter(Boolean),
    streakRewards: section("streak").map((row) => ({ visits: row.label, reward: row.value })),
    annualStatus: section("annual").map((row) => ({
      tier: row.label,
      range: row.value,
      perks: String(row.perks || "").split("|").map((perk) => perk.trim()).filter(Boolean),
    })),
  };
}

async function fetchRewardsSheet() {
  const spreadsheetId = process.env.REWARDS_SHEET_ID || DEFAULT_SPREADSHEET_ID;
  const sheetTab = process.env.REWARDS_SHEET_TAB || DEFAULT_SHEET_TAB;
  const query = new URLSearchParams({ tqx: "out:csv", sheet: sheetTab });
  const response = await fetch(
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${query}`,
    { cache: "no-store", signal: AbortSignal.timeout(8_000) },
  );

  if (!response.ok) {
    throw new Error(`Rewards sheet returned ${response.status}.`);
  }

  const rows = rowsToObjects(await response.text());
  if (!rows.length) throw new Error("Rewards sheet is empty.");
  return buildConfig(rows);
}

export async function getRewardsSheetConfig({ fresh = false } = {}) {
  const ttl = Number(process.env.REWARDS_SHEET_CACHE_TTL_MS || DEFAULT_CACHE_TTL_MS);

  if (!fresh && cachedConfig && Date.now() - cachedAt < ttl) {
    return cachedConfig;
  }

  if (!pendingRequest) {
    pendingRequest = fetchRewardsSheet()
      .then((config) => {
        cachedConfig = config;
        cachedAt = Date.now();
        return config;
      })
      .catch((error) => {
        console.warn(`Rewards sheet unavailable: ${error.message}`);
        return cachedConfig;
      })
      .finally(() => {
        pendingRequest = null;
      });
  }

  return pendingRequest;
}
