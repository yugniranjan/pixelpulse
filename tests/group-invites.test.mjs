import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

async function loadRoute(path, dependencies, env = {}) {
  const context = createContext({ console, URL, Date, Buffer, process: { env } });
  const route = new SourceTextModule(await readFile(new URL(path, import.meta.url), "utf8"), { context });
  await route.link(async (specifier) => {
    if (specifier === "@/lib/groupInvites") {
      const module = new SourceTextModule(await readFile(new URL("../src/app/lib/groupInvites.js", import.meta.url), "utf8"), { context });
      await module.link(() => { throw new Error("Unexpected group utility dependency"); });
      return module;
    }
    const exports = dependencies[specifier];
    assert(exports, `Missing dependency: ${specifier}`);
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context });
  });
  await route.evaluate();
  return route.namespace;
}

function request(path, body, method = "POST") {
  return new Request(`https://example.test${path}`, {
    method,
    ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  });
}

async function inviteStore() {
  const invites = new Map();
  const seeds = new Map();
  const api = await loadRoute("../src/app/api/admin/invites/route.js", {
    "next/server": { NextResponse: Response },
    "@/lib/firestore": { db: null },
    "@/lib/ctaContent": { getConfigValue: () => "" },
    "@/lib/invites": { normalizeInviteSlug: (value) => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") },
    "@/lib/partyWaivers": { partyWaiverDocId: (id) => id },
    "@/lib/sheets": { fetchsheetdata: async () => [] },
    "@/lib/constant": { LOCATION_NAME: "vaughan" },
    "@/lib/postgresData": {
      hasPostgres: () => true,
      listPostgresInvites: async () => [...invites.values()],
      getPostgresInviteByPartyId: async (id) => [...invites.values()].find((invite) => invite.partyId === id),
      getPostgresInviteBySlug: async (slug) => invites.get(slug),
      getPostgresPartyWaiver: async (id) => seeds.get(id),
      postgresInviteSlugExists: async (slug) => invites.has(slug),
      upsertPostgresInvite: async (invite) => invites.set(invite.slug, invite),
      upsertPostgresPartyWaiver: async (seed) => seeds.set(seed.partyId, seed),
      deletePostgresInvite: async (slug) => invites.delete(slug),
    },
  });
  return { api, invites, seeds };
}

const group = {
  inviteType: "group", eventType: "corporate", groupId: "GROUP-101", childName: "Acme Team Night",
  date: "2026-11-06", time: "6:00 PM - 8:00 PM", rsvpName: "Alex", phone: "9055550100",
  childrenIncluded: "20", partyPackage: "90-minute group play",
};

test("group creation persists its type, generates Group ID links, and seeds the waiver", async () => {
  const { api, seeds, invites } = await inviteStore();
  const response = await api.POST(request("/api/admin/invites?type=group", group));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.groupId, "GROUP-101");
  assert.equal(result.waiverUrl, "https://example.test/waiver?groupId=GROUP-101");
  assert.match(result.confirmationEmailText, /Group ID: GROUP-101/);
  assert.match(result.confirmationEmailText, /Participants Included: 20/);
  assert.doesNotMatch(result.confirmationEmailText, /Play Duration:|Room Access:|Food & Add-ons:|Additional Extras:|Special Notes:/);
  assert.doesNotMatch(result.confirmationEmailText, /birthday|children|Party ID|pizza is provided/i);
  assert.equal(seeds.get("GROUP-101").inviteType, "group");
  assert.equal(invites.get(result.slug).inviteType, "group");
});

test("birthday and group lists stay separate; editing and deleting respect the module", async () => {
  const { api } = await inviteStore();
  const created = await (await api.POST(request("/api/admin/invites?type=group", group))).json();
  const birthday = { ...group, inviteType: "birthday", partyId: "BIRTHDAY-1", childName: "Taylor" };
  const birthdayResult = await (await api.POST(request("/api/admin/invites", birthday))).json();
  assert.match(birthdayResult.waiverUrl, /\?partyId=BIRTHDAY-1/);
  assert.match(birthdayResult.confirmationEmailText, /birthday/i);
  assert.doesNotMatch(birthdayResult.confirmationEmailText, /Play Duration:|Party Room Access:|Food & Add-ons:|Additional Extras:|Special Notes:/);
  const groupList = await (await api.GET(request("/api/admin/invites?list=1&type=group", null, "GET"))).json();
  const birthdayList = await (await api.GET(request("/api/admin/invites?list=1", null, "GET"))).json();
  assert.equal(groupList.invites.length, 1);
  assert.equal(birthdayList.invites.length, 1);
  assert.equal((await api.PUT(request(`/api/admin/invites?slug=${created.slug}`, { time: "7:00 PM" }, "PUT"))).status, 404);
  const edit = await api.PUT(request(`/api/admin/invites?type=group&slug=${created.slug}`, { eventType: "adult", groupId: "GROUP-102" }, "PUT"));
  assert.equal(edit.status, 200);
  const { invite } = await edit.json();
  assert.match(invite.confirmationEmailText, /Adult group/);
  assert.equal(invite.waiverLink, "https://example.test/waiver?groupId=GROUP-102");
  assert.equal((await api.DELETE(request(`/api/admin/invites?slug=${created.slug}`, null, "DELETE"))).status, 404);
  assert.equal((await api.DELETE(request(`/api/admin/invites?type=group&slug=${created.slug}`, null, "DELETE"))).status, 200);
});

test("group IDs cannot overwrite birthday waiver seeds or invitations", async () => {
  const { api, seeds } = await inviteStore();
  seeds.set("GROUP-101", { partyId: "GROUP-101", primaryParticipant: "Birthday child" });
  assert.equal((await api.POST(request("/api/admin/invites?type=group", group))).status, 409);
  seeds.clear();
  await api.POST(request("/api/admin/invites", { ...group, inviteType: "birthday", partyId: "GROUP-101" }));
  assert.equal((await api.POST(request("/api/admin/invites?type=group", group))).status, 409);
});

test("group invite, waiver, and confirmation emails have Group ID wording without birthday inclusions", async () => {
  const messages = [];
  const api = await loadRoute("../src/app/api/admin/invites/email/route.js", {
    "next/server": { NextResponse: Response },
    nodemailer: { default: { createTransport: () => ({ sendMail: async (mail) => messages.push(mail) }) } },
  }, { GMAIL_USER: "test@example.test", GMAIL_APP_PASSWORD: "test-only" });
  const base = { email: "guest@example.test", inviteType: "group", groupId: "GROUP-101", inviteUrl: "https://example.test/invite/acme", waiverUrl: "https://example.test/waiver?groupId=GROUP-101" };
  const { api: invites } = await inviteStore();
  const generated = await (await invites.POST(request("/api/admin/invites?type=group", group))).json();
  for (const email of [
    { ...base, smsText: generated.smsText },
    { ...base, type: "waiver" },
    { ...base, confirmationEmailText: `${generated.confirmationEmailText}\nFood & Add-ons:   \nPlay Duration: As confirmed in your booking\nSpecial Notes: None specified\nAdditional Extras: Team shirts` },
  ]) assert.equal((await api.POST(request("/api/admin/invites/email", email))).status, 200);
  assert.equal(messages.length, 3);
  const birthday = await (await invites.POST(request("/api/admin/invites", { ...group, inviteType: "birthday", partyId: "BIRTHDAY-EMAIL", childrenIncluded: "", partyPackage: "" }))).json();
  assert.equal((await api.POST(request("/api/admin/invites/email", {
    email: base.email, inviteUrl: birthday.inviteUrl, partyId: "BIRTHDAY-EMAIL",
    confirmationEmailText: `${birthday.confirmationEmailText}\nFood & Add-ons: \nPlay Duration: As confirmed in your booking\nSpecial Notes: None specified\nAdditional Extras: Cake table`,
  }))).status, 200);
  const birthdayMail = messages[3];
  assert.match(birthdayMail.html, /background:#000000/);
  assert.match(birthdayMail.html, /<img[^>]+alt="Pixel Pulse Play"/);
  assert.match(birthdayMail.html, /Your Birthday Party is Confirmed/);
  assert.match(birthdayMail.text, /Party ID: BIRTHDAY-EMAIL/);
  assert.match(birthdayMail.text, /Additional Extras: Cake table/);
  assert.doesNotMatch(birthdayMail.text + birthdayMail.html, /Food & Add-ons:|Play Duration:|Special Notes:|Number of Children Included:|Party Room Access:|Party Package:/);
  assert.doesNotMatch(birthdayMail.html, /Group ID|Your Group Event/);
  for (const mail of messages) {
    if (mail === birthdayMail) continue;
    assert.match(mail.text, /Group ID: GROUP-101/);
    assert.doesNotMatch(mail.subject + mail.html + mail.text, /birthday|Party ID|Number of Children|Pizza is provided/i);
  }
  assert.match(messages[1].html, /groupId=GROUP-101/);
  assert.match(messages[2].subject, /Group Event is Confirmed/);
  assert.doesNotMatch(messages[2].text + messages[2].html, /Food & Add-ons:|Play Duration:|Special Notes:/);
  assert.match(messages[2].text, /Additional Extras: Team shirts/);
  assert.equal((await api.POST(request("/api/admin/invites/email", { ...base, type: "waiver", waiverUrl: "javascript:alert(1)" }))).status, 400);
  assert.equal(messages.length, 4);
});
