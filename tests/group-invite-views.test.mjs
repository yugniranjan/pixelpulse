import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as groupUtilities from "../src/app/lib/groupInvites.js";
import * as ctaUtilities from "../src/app/lib/ctaContent.js";
import * as trackingScope from "../src/app/lib/trackingScope.js";

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
  return module.exports.default || module.exports;
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
    assert.match(html, /<header class="ppp-group-invite-header">/);
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

test("confirmation details omit blank values and retain zero or completed fields", () => {
  assert.equal(groupUtilities.confirmationDetail("Extras", "  "), null);
  assert.equal(groupUtilities.confirmationDetail("Extras", 0), "Extras: 0");
  assert.equal(groupUtilities.confirmationDetail("Notes", " Bring team shirts "), "Notes: Bring team shirts");
});

test("additional participant name input preserves spaces during typing and parses saved names", async () => {
  const states = [];
  let cursor = 0;
  const WaiverForm = await component("../src/app/components/WaiverForm.jsx", {
    react: {
      ...React,
      useState: (initial) => {
        const index = cursor++;
        if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
        return [states[index], (next) => { states[index] = typeof next === "function" ? next(states[index]) : next; }];
      },
      useRef: (current) => ({ current }),
      useMemo: (calculate) => calculate(),
      useEffect: () => {},
    },
  });
  const render = () => { cursor = 0; return WaiverForm({}); };
  const find = (node, predicate) => {
    if (!React.isValidElement(node)) return null;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props.children)) {
      const result = find(child, predicate);
      if (result) return result;
    }
    return null;
  };
  const add = () => find(render(), (node) => node.type === "button" && String(node.props.children).includes("Add a person")).props.onClick();
  const input = () => find(render(), (node) => node.props["aria-label"] === "Person 1 full name");
  add();
  add();
  for (const character of "Mary Jane Doe") {
    const field = input();
    const expected = field.props.value + character;
    field.props.onChange({ target: { value: expected } });
    assert.equal(input().props.value, expected);
  }
  input().props.onChange({ target: { value: "Mary  Jane Doe " } });
  assert.equal(input().props.value, "Mary  Jane Doe ");
  const members = states.find((state) => Array.isArray(state) && state.length === 2);
  assert.equal(members[0].firstName, "Mary");
  assert.equal(members[0].lastName, "Jane Doe");
  assert.equal(members[1].firstName, "");
  input().props.onChange({ target: { value: "" } });
  assert.equal(input().props.value, "");
});

test("GTM uses the config sheet and renders once in head and first in body even when other tracking is excluded", async () => {
  const gtm = await component("../src/app/components/GoogleTagManager.jsx");
  for (const configuredId of ["GTM-53N567VP", "GTM-TEST123", "invalid<script>"]) {
    const blank = () => null;
    let requestPath = "/";
    const RootLayout = await component("../src/app/layout.js", {
      "./components/GoogleTagManager": gtm,
      "next/headers": { headers: () => new Headers({ [trackingScope.TRACKING_PATH_HEADER]: requestPath }) },
      "@/lib/trackingScope": trackingScope,
      "./components/TrackingVisibility": blank,
      "./components/TrackingPageViews": blank,
      "./components/ChromeVisibility": blank,
      "./components/Header": blank,
      "./components/Footer": blank,
      "./components/FloatingWaiverButton": blank,
      "./components/Breadcrumb": blank,
      "./loading": blank,
      sonner: { Toaster: blank },
      "./lib/sheets": {
        fetchMenuData: async () => [],
        fetchsheetdata: async (name) => name === "config" ? [{ key: "gtm_id", value: configuredId }] : [{ gtm_id: "GTM-LOCATION" }],
      },
      "./lib/constant": { LOCATION_NAME: "vaughan" },
      "./lib/ctaContent": ctaUtilities,
      "@/lib/seo": { canonicalUrl: () => "https://pixelpulseplay.ca", getCanonicalSiteUrl: () => "https://pixelpulseplay.ca" },
    });
    const html = renderToStaticMarkup(await RootLayout({ children: React.createElement("main", null, "Page") }));
    const expectedId = gtm.cleanGtmId(configuredId) || gtm.DEFAULT_GTM_ID;
    assert.match(html, /<head><script id="google-tag-manager">/);
    assert.match(html, /<body><noscript><iframe/);
    assert.match(html, new RegExp(`ns.html\\?id=${expectedId}`));
    assert.equal((html.match(/id="google-tag-manager"/g) || []).length, 1);
    assert.doesNotMatch(html, /GTM-LOCATION|invalid<script>/);
    for (const path of ["/admin/login", "/waiver", "/waiver-data", "/invite/team-event"]) {
      requestPath = path;
      const privateHtml = renderToStaticMarkup(await RootLayout({ children: React.createElement("main", null, "Private page") }));
      assert.doesNotMatch(privateHtml, /google-tag-manager|googletagmanager\.com|ns\.html/);
    }
  }
});

test("tracking scope excludes sensitive routes and malformed or absent paths", () => {
  for (const path of ["/admin", "/admin/waivers", "/waiver", "/waiver/123", "/waiver-data", "/invite/team-event", "/api/admin", "/concessions-tv", "/%61dmin/login", undefined, "%"]) {
    assert.equal(trackingScope.isPublicTrackingPath(path), false, String(path));
  }
  for (const path of ["/", "/birthday-party-bookings-vaughan", "/birthday-party-landing", "/kids-birthday-parties", "/contactus"]) {
    assert.equal(trackingScope.isPublicTrackingPath(path), true, path);
  }
});

test("middleware overwrites spoofed tracking paths and preserves public subdomain rewrites", async () => {
  const middleware = await component("../src/middleware.js", {
    "./app/lib/trackingScope": trackingScope,
    "next/server": { NextResponse: {
      next: (options) => ({ type: "next", ...options }),
      rewrite: (url, options) => ({ type: "rewrite", url, ...options }),
      redirect: (url) => ({ type: "redirect", url }),
    } },
  });
  for (const [host, path] of [["birthdays.pixelpulseplay.ca", "/"], ["pixelpulseplay.ca", "/admin/login"]]) {
    const url = new URL(`https://${host}${path}`);
    url.clone = () => new URL(url);
    const result = middleware.middleware({ nextUrl: url, url: url.href, headers: new Headers({ host, [trackingScope.TRACKING_PATH_HEADER]: "/spoofed" }), cookies: { get: () => undefined } });
    assert.equal(result.request.headers.get(trackingScope.TRACKING_PATH_HEADER), path);
    if (host.startsWith("birthdays")) {
      assert.equal(result.type, "rewrite");
      assert.equal(result.url.pathname, "/birthday-party-bookings-vaughan");
    }
  }
});

test("Punch and Ultra use online booking while Jumbo and Max retain inquiry", async () => {
  for (const selectedPackage of ["Pixel Punch", "Pixel Ultra", "Pixel Jumbo", "Pulse Max"]) {
    const BirthdayForm = await component("../src/app/components/BirthdayHeroContactForm.jsx", {
      react: {
        ...React,
        useState: (value) => [value && typeof value === "object" && "selectedPackage" in value ? { ...value, selectedPackage } : value, () => {}],
        useEffect: () => {},
      },
      "next/navigation": { useRouter: () => ({}), useSearchParams: () => new URLSearchParams() },
      "@/lib/useTurnstileSiteKey": { useTurnstileSiteKey: () => ({}) },
      "./smallComponents/TurnstileWidget": { default: () => null },
    });
    const html = renderToStaticMarkup(React.createElement(BirthdayForm, { packageOptions: [selectedPackage] }));
    if (["Pixel Punch", "Pixel Ultra"].includes(selectedPackage)) {
      assert.match(html, /lilypadpos\.app\/public\/onlinebooking\/step1\.php\?ptid=21/);
      assert.match(html, /Continue to online booking/);
      assert.doesNotMatch(html, /Send Birthday Request|Select a package to continue/);
    } else {
      assert.match(html, /Send Birthday Request/);
      assert.doesNotMatch(html, /lilypadpos\.app/);
    }
  }
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
