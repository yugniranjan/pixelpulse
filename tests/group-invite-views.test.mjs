import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as groupUtilities from "../src/app/lib/groupInvites.js";

const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");

async function component(path, overrides = {}) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const { code } = transformSync(source, {
    filename: path,
    jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } } },
    module: { type: "commonjs" },
  });
  const module = { exports: {} };
  const resolve = (name) => {
    if (name.endsWith(".css")) return {};
    if (name === "@/lib/groupInvites") return groupUtilities;
    if (name === "next/image") return ({ fill, priority, ...props }) => React.createElement("img", props);
    return overrides[name] || require(name);
  };
  new Function("require", "module", "exports", code)(resolve, module, module.exports);
  return module.exports.default;
}

test("group admin fields use Group ID and adult/organizer terms while birthdays retain their fields", async () => {
  const AdminInvites = await component("../src/app/components/AdminInvitesClient.jsx", {
    react: {
      ...React,
      useState: (value) => [typeof value === "function" ? value() : value, () => {}],
      useMemo: (calculate) => calculate(),
      useEffect: () => {},
    },
    "@/components/AdminShell": ({ children }) => children,
  });
  const groupHtml = renderToStaticMarkup(React.createElement(AdminInvites, { inviteType: "group" }));
  assert.match(groupHtml, /Create Group Links/);
  assert.match(groupHtml, /Group ID/);
  assert.match(groupHtml, /Participants included/);
  assert.match(groupHtml, /Organizer \/ host name/);
  assert.doesNotMatch(groupHtml, /Child name|Parent \/ Party Host|Birthday Party|Party ID|Extra kids/);
  const birthdayHtml = renderToStaticMarkup(React.createElement(AdminInvites));
  assert.match(birthdayHtml, /Child name/);
  assert.match(birthdayHtml, /Party ID/);
  assert.match(birthdayHtml, /Birthday Party/);
});

test("guest group invite renders its name, Group ID, and waiver link without birthday decorations", async () => {
  const GroupInvite = await component("../src/app/components/GroupInvite.jsx");
  for (const eventType of ["corporate", "adult"]) {
    const html = renderToStaticMarkup(React.createElement(GroupInvite, { invite: {
      eventType, childName: "Acme Team Night", groupId: "GROUP-101", date: "2026-11-06", time: "6:00 PM",
      phone: "9055550100", rsvpName: "Alex", waiverLink: "/waiver?groupId=GROUP-101",
    } }));
    assert.match(html, /Acme Team Night/);
    assert.match(html, /Group ID/);
    assert.match(html, /GROUP-101/);
    assert.match(html, /groupId=GROUP-101/);
    assert.match(html, /floorchallenge.webp/);
    assert.match(html, /ppp-group-invite-tiles/);
    assert.doesNotMatch(html, /Birthday|Party ID|balloon|&#x27;s/);
  }
});

test("older group invites select the group layout while birthdays remain birthdays", () => {
  assert.equal(groupUtilities.inviteKind({ slug: "booddd", title: "Group Event" }), "group");
  assert.equal(groupUtilities.inviteKind({ groupId: "G101" }), "group");
  assert.equal(groupUtilities.inviteKind({ eventType: "adult" }), "group");
  assert.equal(groupUtilities.inviteKind({ title: "Birthday Party" }), "birthday");
  assert.equal(groupUtilities.inviteKind({ inviteType: "birthday", title: "Group Event" }), "birthday");
});

test("group waiver links preload their event and Group ID", async () => {
  let formProps;
  const WaiverPage = await component("../src/app/waiver/page.jsx", {
    "@/components/WaiverForm": (props) => { formProps = props; return null; },
    "@/lib/firestore": { db: null },
    "@/lib/sheets": { fetchsheetdataNoCache: async () => [] },
    "@/lib/partyWaivers": { partyWaiverDocId: (id) => id },
    "@/lib/seo": { canonicalUrl: (path) => path },
    "@/lib/postgresData": {
      hasPostgres: () => true,
      getPostgresPartyWaiver: async (id) => {
        assert.equal(id, "GROUP-101");
        return { primaryParticipant: "Acme Team Night", passType: "Group play", visitDate: "2026-11-06", visitTime: "6:00 PM" };
      },
    },
  });
  renderToStaticMarkup(await WaiverPage({ searchParams: Promise.resolve({ groupId: "GROUP-101" }) }));
  assert.equal(formProps.initialVisit.groupId, "GROUP-101");
  assert.equal(formProps.initialVisit.partyId, "GROUP-101");
  assert.equal(formProps.initialVisit.partyName, "Acme Team Night");
  assert.equal(formProps.initialVisit.visitDate, "2026-11-06");
  assert.equal(formProps.waiverContent.partyIdLabel, "Group ID");
});
