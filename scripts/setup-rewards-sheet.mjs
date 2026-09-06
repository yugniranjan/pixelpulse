import nextEnv from "@next/env";
import { GoogleAuth } from "google-auth-library";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const spreadsheetId = process.env.REWARDS_SHEET_ID || "1NEovNJVBVY4LyXWg3nHFh5-LekMt8GfL4y4eaNz7X1I";
const sheetTitle = process.env.REWARDS_SHEET_TAB || "Rewards";
const applyChanges = process.argv.includes("--apply");

const headers = [
  "section",
  "key",
  "label",
  "title",
  "text",
  "value",
  "detail",
  "threshold_points",
  "reward_type",
  "icon",
  "perks",
  "sort_order",
  "enabled",
];

const rows = [
  ["page", "hero_kicker", "", "", "Level Up Rewards App"],
  ["page", "hero_title", "", "Your Pixel Pulse", "", "Rewards."],
  ["page", "hero_description", "", "", "Already played at Pixel Pulse? Enter the email or phone number used for your visit to open your dashboard, check your points, and redeem unlocked rewards."],
  ["page", "how_eyebrow", "", "", "How it works"],
  ["page", "how_title", "", "PulsePoints turns every visit into progress."],
  ["page", "how_description", "", "", "Earn PulsePoints every time you play, unlock rewards as you level up, and work your way toward VIP status all year long."],
  ["page", "visual_eyebrow", "", "", "Every visit counts"],
  ["page", "visual_title", "", "Keep moving up every time you visit."],
  ["page", "visual_description", "", "", "Repeat visits, referrals, birthdays, and monthly streaks bring your next reward closer."],
  ["page", "ladder_eyebrow", "", "", "Reward Ladder"],
  ["page", "ladder_title", "", "From quick credits to Pixel Pulse VIP."],
  ["page", "ladder_description", "", "", "Move through 10 reward levels as your lifetime PulsePoints grow."],
  ["page", "signage_eyebrow", "", "", "Suggested Signage"],
  ["page", "signage_title", "", "PulsePoints Rewards"],
  ["page", "signage_description", "", "", "Earn points every time you play."],
  ["page", "vip_eyebrow", "", "", "VIP Member Benefits"],
  ["page", "vip_title", "", "Reach VIP at 250,000 points."],
  ["page", "prize_eyebrow", "", "", "Surprise Rewards"],
  ["page", "prize_title", "", "Spin the Prize Wheel."],
  ["page", "prize_description", "", "", "Every level-up comes with a surprise spin. See what you win next."],
  ["page", "streak_eyebrow", "", "", "Monthly Visit Streaks"],
  ["page", "streak_title", "", "Visit more this month. Unlock extra rewards."],
  ["page", "streak_description", "", "", "Each visit moves your monthly streak forward and brings the next reward closer."],
  ["page", "annual_eyebrow", "", "", "Annual Membership Status"],
  ["page", "annual_title", "", "Keep leveling up all year."],
  ["page", "annual_description", "", "", "Your annual status grows with your points and unlocks even more member perks."],
  ["page", "cta_eyebrow", "", "", "Ready to level up?"],
  ["page", "cta_title", "", "Ask staff about Level Up Rewards on your next visit."],
  ["page", "cta_description", "", "", "Use the player app above to check your balance, level, unlocked rewards, and progress toward your next reward."],
  ["page", "cta_button", "", "", "Contact Pixel Pulse"],
  ["hero_stat", "access", "Player access", "", "", "Email or phone", "", "", "", "", "", 1],
  ["hero_stat", "ladder", "Reward ladder", "", "", "10 levels", "", "", "", "", "", 2],
  ["hero_stat", "streaks", "Monthly streaks", "", "", "Extra rewards", "", "", "", "", "", 3],
  ["how_step", "book_play", "01", "Book or play", "Explorer, All-Access, Booster, parties, and add-ons all feed the same player profile.", "", "Every visit moves you forward", "", "", "", "", 1],
  ["how_step", "streak", "02", "Build your streak", "Friends, birthdays, and repeat visits help you unlock more rewards.", "", "Visit more, unlock more", "", "", "", "", 2],
  ["how_step", "unlock", "03", "Unlock rewards", "Every level opens a reward, then adds a surprise prize-wheel moment at the counter.", "", "Free play, upgrades, VIP status", "", "", "", "", 3],
  ["reward", "level_1", "Level 1", "10 Arcade Credits", "Load 10 arcade credits and keep the fun going.", "", "", 5000, "arcade_credits", "gift", "", 1],
  ["reward", "level_2", "Level 2", "20 Arcade Credits", "Enjoy 20 arcade credits for even more games on your next visit.", "", "", 12000, "arcade_credits", "medal", "", 2],
  ["reward", "level_3", "Level 3", "Free Drink or Snack", "Choose a refreshing drink or a tasty snack.", "", "", 20000, "snack", "drink", "", 3],
  ["reward", "level_4", "Level 4", "30 Bonus Minutes", "Enjoy 30 extra minutes of play on a weekday.", "", "", 35000, "bonus_minutes", "ticket", "", 4],
  ["reward", "level_5", "Level 5", "Pixel Pulse Coffee Mug", "Take home your own Pixel Pulse coffee mug.", "", "", 50000, "merchandise", "mug", "", 5],
  ["reward", "level_6", "Level 6", "Friend Pass", "Bring a friend and enjoy 30 minutes of play together.", "", "", 70000, "friend_pass", "gift", "", 6],
  ["reward", "level_7", "Level 7", "Free Upgrade to 90-Min Pass", "Upgrade your visit to a 90-minute pass at no extra cost.", "", "", 90000, "upgrade", "shirt", "", 7],
  ["reward", "level_8", "Level 8", "FREE 60-Minute Pass", "Enjoy a full 60-minute play session on us.", "", "", 120000, "play_pass", "ticket", "", 8],
  ["reward", "level_9", "Level 9", "FREE 90-Minute Pass", "Unlock a full 90-minute play session on us.", "", "", 160000, "play_pass", "ticket", "", 9],
  ["reward", "level_10", "Level 10", "Pixel Pulse VIP Member", "Reach VIP status and enjoy our best member perks.", "", "", 250000, "vip_status", "birthday", "", 10],
  ["vip_benefit", "skip_line", "", "", "", "Skip-the-line check-in", "", "", "", "", "", 1],
  ["vip_benefit", "food_discount", "", "", "", "10% off food and beverages", "", "", "", "", "", 2],
  ["vip_benefit", "weekday_offers", "", "", "", "Weekday member offers", "", "", "", "", "", 3],
  ["vip_benefit", "birthday", "", "", "", "Birthday surprise reward", "", "", "", "", "", 4],
  ["vip_benefit", "events", "", "", "", "Exclusive event invitations", "", "", "", "", "", 5],
  ["vip_benefit", "guest_pass", "", "", "", "One free guest pass every quarter", "", "", "", "", "", 6],
  ["prize", "arcade_credits", "", "", "", "10 Arcade Credits", "", "", "", "", "", 1],
  ["prize", "drink", "", "", "", "Drink", "", "", "", "", "", 2],
  ["prize", "candy", "", "", "", "Candy", "", "", "", "", "", 3],
  ["prize", "minutes", "", "", "", "Extra 15 Minutes", "", "", "", "", "", 4],
  ["prize", "upgrade", "", "", "", "Free Upgrade", "", "", "", "", "", 5],
  ["prize", "sticker", "", "", "", "Pixel Pulse Sticker", "", "", "", "", "", 6],
  ["prize", "mystery", "", "", "", "Mystery Prize", "", "", "", "", "", 7],
  ["streak", "two", "2 visits in a month", "", "", "Free Drink", "", "", "", "", "", 1],
  ["streak", "three", "3 visits in a month", "", "", "10 Arcade Credits", "", "", "", "", "", 2],
  ["streak", "five", "5 visits in a month", "", "", "FREE 30 Minutes", "", "", "", "", "", 3],
  ["streak", "eight", "8 visits in a month", "", "", "FREE 60-Minute Pass", "", "", "", "", "", 4],
  ["annual", "bronze", "Bronze", "", "", "0-100k points", "", "", "", "", "Start earning toward major rewards", 1],
  ["annual", "silver", "Silver", "", "", "100k-250k points", "", "", "", "", "Early access to member events", 2],
  ["annual", "gold", "Gold", "", "", "250k+ points", "", "", "", "", "Weekday member offers|Exclusive events|Birthday free pass", 3],
].map((row) => {
  const padded = [...row];
  while (padded.length < headers.length - 1) padded.push("");
  padded.push(true);
  return padded;
});

function requireEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const auth = new GoogleAuth({
  credentials: {
    client_email: requireEnv("GCP_CLIENT_EMAIL"),
    private_key: requireEnv("GCP_PRIVATE_KEY").replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const authClient = await auth.getClient();
const requestHeaders = await authClient.getRequestHeaders();

async function sheetsRequest(path, options = {}) {
  const headers = new Headers(requestHeaders);
  headers.set("Content-Type", "application/json");
  for (const [name, value] of Object.entries(options.headers || {})) {
    headers.set(name, value);
  }

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${path}`, {
    ...options,
    headers,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || `Google Sheets API returned ${response.status}.`);
  }
  return body;
}

const metadata = await sheetsRequest("?fields=properties.title,sheets.properties");
const existingSheet = metadata.sheets?.find((sheet) => sheet.properties?.title === sheetTitle);

console.log(`Spreadsheet: ${metadata.properties?.title || spreadsheetId}`);
console.log(`${sheetTitle} tab: ${existingSheet ? "present" : "missing"}`);

if (!applyChanges) {
  console.log("Read-only check complete. Run with --apply to create and populate the tab.");
  process.exit(0);
}

let sheetId = existingSheet?.properties?.sheetId;
if (!existingSheet) {
  const created = await sheetsRequest(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title: sheetTitle, gridProperties: { frozenRowCount: 1 } } } }],
    }),
  });
  sheetId = created.replies?.[0]?.addSheet?.properties?.sheetId;
}

const encodedRange = encodeURIComponent(`${sheetTitle}!A1:M${rows.length + 1}`);
await sheetsRequest(`/values/${encodedRange}?valueInputOption=RAW`, {
  method: "PUT",
  body: JSON.stringify({ range: `${sheetTitle}!A1:M${rows.length + 1}`, majorDimension: "ROWS", values: [headers, ...rows] }),
});

await sheetsRequest(":batchUpdate", {
  method: "POST",
  body: JSON.stringify({
    requests: [
      {
        updateSheetProperties: {
          properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
          fields: "gridProperties.frozenRowCount",
        },
      },
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.07, green: 0.22, blue: 0.25 },
              textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true },
            },
          },
          fields: "userEnteredFormat(backgroundColor,textFormat)",
        },
      },
      {
        autoResizeDimensions: {
          dimensions: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: headers.length },
        },
      },
    ],
  }),
});

console.log(`${sheetTitle} tab populated with ${rows.length} editable content rows.`);
