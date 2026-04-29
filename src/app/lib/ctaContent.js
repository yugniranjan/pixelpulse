export function normalizeKey(value = "") {
  return String(value || "")
    .trim()
    .replace(/^_+/, "")
    .toLowerCase();
}

export function normalizeValue(value = "") {
  const trimmed = String(value ?? "").trim();
  return trimmed === "_" ? "" : trimmed;
}

export function hasConfiguredKey(data = [], keys = []) {
  const normalizedKeys = (Array.isArray(keys) ? keys : [keys])
    .map(normalizeKey)
    .filter(Boolean);

  if (normalizedKeys.length === 0) {
    return false;
  }

  if (Array.isArray(data)) {
    return data.some((item) => normalizedKeys.includes(normalizeKey(item?.key)));
  }

  return Object.keys(data || {}).some((key) =>
    normalizedKeys.includes(normalizeKey(key)),
  );
}

export function resolveConfiguredValue({
  sources = [],
  keys = [],
  value = "",
  fallback = "",
}) {
  const configured = (Array.isArray(sources) ? sources : [sources]).some((source) =>
    hasConfiguredKey(source, keys),
  );

  if (configured) {
    return value || "";
  }

  return value || fallback;
}

export function getConfigValue(configData = [], keys = []) {
  const normalizedKeys = (Array.isArray(keys) ? keys : [keys])
    .map(normalizeKey)
    .filter(Boolean);

  if (!Array.isArray(configData) || normalizedKeys.length === 0) {
    return "";
  }

  const row = configData.find((item) =>
    normalizedKeys.includes(normalizeKey(item?.key)),
  );

  return row?.value !== undefined && row?.value !== null
    ? normalizeValue(row.value)
    : "";
}

export function getRowValue(row = {}, keys = []) {
  const normalizedKeys = (Array.isArray(keys) ? keys : [keys])
    .map(normalizeKey)
    .filter(Boolean);

  const matchingKey = Object.keys(row || {}).find((key) =>
    normalizedKeys.includes(normalizeKey(key)),
  );

  return matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null
    ? normalizeValue(row[matchingKey])
    : "";
}

export function getConfiguredValue(sources = [], keys = [], fallback = "") {
  const isConfigRowArray =
    Array.isArray(sources) &&
    sources.some(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        Object.prototype.hasOwnProperty.call(item, "key"),
    );
  const sourceList = isConfigRowArray
    ? [sources]
    : Array.isArray(sources)
      ? sources
      : [sources];

  for (const source of sourceList) {
    if (!hasConfiguredKey(source, keys)) {
      continue;
    }

    return Array.isArray(source)
      ? getConfigValue(source, keys)
      : getRowValue(source, keys);
  }

  return fallback;
}

export function getCtaContent(configData = {}) {
  const fromConfig = Array.isArray(configData)
    ? (keys) => getConfigValue(configData, keys)
    : () => "";
  const fromObject = !Array.isArray(configData)
    ? (keys) => getRowValue(configData, keys)
    : () => "";
  const getValue = (keys) => fromConfig(keys) || fromObject(keys);

  return {
    bookNowText: getValue([
      "cta_book_now",
      "ctaBookNow",
      "bookNowText",
      "bookNowLabel",
      "bookingButtonText",
      "headerBookNowText",
    ]),
    inquireText: getValue([
      "cta_inquire",
      "ctaInquire",
      "inquireText",
      "inquireLabel",
      "headerInquireText",
    ]),
    contactHref: getValue(["cta_contact_href", "contactHref", "inquireHref"]),
    pricingText: getValue([
      "cta_pricing",
      "ctaPricing",
      "pricingText",
      "pricingLinkText",
      "viewPricingText",
    ]),
    pricingHref: getValue(["cta_pricing_href", "pricingHref", "pricingLink"]),
    articlesText: getValue([
      "cta_articles",
      "articlesText",
      "articlesLinkText",
      "blogLinkText",
    ]),
    articlesHref: getValue(["cta_articles_href", "articlesHref", "blogLinkHref"]),
    findLocationText: getValue([
      "cta_find_location",
      "findLocationText",
      "mapsLinkText",
    ]),
    learnMoreText: getValue(["cta_learn_more", "learnMoreText", "cardLinkText"]),
    readMoreText: getValue(["cta_read_more", "readMoreText"]),
    exploreOptionText: getValue(["cta_explore_option", "exploreOptionText"]),
    claimOfferText: getValue(["cta_claim_offer", "claimOfferText", "promoLinkText"]),
    pricingSecondaryText: getValue([
      "pricingCtaSecondaryText",
      "pricingSecondaryButton",
      "pricingCtaBookButton",
    ]),
    pricingSecondaryBookingType: getConfiguredValue(
      configData,
      ["pricingCtaSecondaryBookingType", "pricingSecondaryBookingType"],
      "ticket",
    ),
    attractionsFinalCtaTitle: getValue([
      "attractionsFinalCtaTitle",
      "attractionFinalCtaTitle",
    ]),
    attractionsFinalCtaSubtitle: getValue([
      "attractionsFinalCtaSubtitle",
      "attractionFinalCtaSubtitle",
    ]),
    attractionsFinalCtaPrimaryText: getValue([
      "attractionsFinalCtaPrimaryText",
      "attractionFinalCtaPrimaryText",
    ]),
    attractionsFinalCtaPrimaryBookingType: getConfiguredValue(
      configData,
      [
        "attractionsFinalCtaPrimaryBookingType",
        "attractionFinalCtaPrimaryBookingType",
      ],
      "ticket",
    ),
    attractionsFinalCtaSecondaryText: getValue([
      "attractionsFinalCtaSecondaryText",
      "attractionFinalCtaSecondaryText",
    ]),
    attractionsFinalCtaSecondaryBookingType: getConfiguredValue(
      configData,
      [
        "attractionsFinalCtaSecondaryBookingType",
        "attractionFinalCtaSecondaryBookingType",
      ],
      "party",
    ),
    groupsHeroSubtitle: getValue([
      "groupsHeroSubtitle",
      "groupHeroSubtitle",
    ]),
    groupsHeroPrimaryText: getValue([
      "groupsHeroPrimaryText",
      "groupHeroPrimaryText",
    ]),
    groupsHeroPrimaryBookingType: getConfiguredValue(
      configData,
      [
        "groupsHeroPrimaryBookingType",
        "groupHeroPrimaryBookingType",
      ],
      "party",
    ),
    groupsHeroSecondaryText: getValue([
      "groupsHeroSecondaryText",
      "groupHeroSecondaryText",
    ]),
    groupsHeroSecondaryHref: getValue([
      "groupsHeroSecondaryHref",
      "groupHeroSecondaryHref",
    ]),
    groupsCardsHeading: getValue([
      "groupsCardsHeading",
      "groupCardsHeading",
    ]),
    groupsFinalCtaTitle: getValue([
      "groupsFinalCtaTitle",
      "groupFinalCtaTitle",
    ]),
    groupsFinalCtaSubtitle: getValue([
      "groupsFinalCtaSubtitle",
      "groupFinalCtaSubtitle",
    ]),
    groupsFinalCtaPrimaryText: getValue([
      "groupsFinalCtaPrimaryText",
      "groupFinalCtaPrimaryText",
    ]),
    groupsFinalCtaPrimaryBookingType: getConfiguredValue(
      configData,
      [
        "groupsFinalCtaPrimaryBookingType",
        "groupFinalCtaPrimaryBookingType",
      ],
      "party",
    ),
    groupsFinalCtaSecondaryText: getValue([
      "groupsFinalCtaSecondaryText",
      "groupFinalCtaSecondaryText",
    ]),
    groupsFinalCtaSecondaryHref: getValue([
      "groupsFinalCtaSecondaryHref",
      "groupFinalCtaSecondaryHref",
    ]),
    birthdayFinalCtaTitle: getValue([
      "birthdayFinalCtaTitle",
      "partyFinalCtaTitle",
    ]),
    birthdayFinalCtaSubtitle: getValue([
      "birthdayFinalCtaSubtitle",
      "partyFinalCtaSubtitle",
    ]),
    birthdayFinalCtaPrimaryText: getValue([
      "birthdayFinalCtaPrimaryText",
      "partyFinalCtaPrimaryText",
    ]),
    birthdayFinalCtaSecondaryText: getValue([
      "birthdayFinalCtaSecondaryText",
      "partyFinalCtaSecondaryText",
    ]),
    birthdayFinalCtaSecondaryHref: getValue([
      "birthdayFinalCtaSecondaryHref",
      "partyFinalCtaSecondaryHref",
    ]),
    birthdayFinalCtaSecondaryBookingType: getConfiguredValue(
      configData,
      [
        "birthdayFinalCtaSecondaryBookingType",
        "partyFinalCtaSecondaryBookingType",
      ],
      "party",
    ),
    pricingPromoInlineCtaTitle: getValue([
      "pricingPromoInlineCtaTitle",
      "pricingPromosInlineCtaTitle",
    ]),
    pricingPromoInlineCtaSubtitle: getValue([
      "pricingPromoInlineCtaSubtitle",
      "pricingPromosInlineCtaSubtitle",
    ]),
    pricingPromoInlineCtaButtonText: getValue([
      "pricingPromoInlineCtaButtonText",
      "pricingPromosInlineCtaButtonText",
    ]),
    pricingPromoHeroLinkText: getValue([
      "pricingPromoHeroLinkText",
      "pricingPromosHeroLinkText",
      "pricingPromoHeroSecondaryText",
      "pricingPromosHeroSecondaryText",
    ]),
    pricingPromoInlineCtaBookingType: getConfiguredValue(
      configData,
      [
        "pricingPromoInlineCtaBookingType",
        "pricingPromosInlineCtaBookingType",
      ],
      "party",
    ),
    pricingPromoFinalCtaTitle: getValue([
      "pricingPromoFinalCtaTitle",
      "pricingPromosFinalCtaTitle",
    ]),
    pricingPromoFinalCtaAccent: getValue([
      "pricingPromoFinalCtaAccent",
      "pricingPromosFinalCtaAccent",
    ]),
    pricingPromoFinalCtaSubtitle: getValue([
      "pricingPromoFinalCtaSubtitle",
      "pricingPromosFinalCtaSubtitle",
    ]),
    pricingPromoFinalCtaHighlight: getValue([
      "pricingPromoFinalCtaHighlight",
      "pricingPromosFinalCtaHighlight",
    ]),
    pricingPromoFinalCtaPrimaryText: getValue([
      "pricingPromoFinalCtaPrimaryText",
      "pricingPromosFinalCtaPrimaryText",
    ]),
    pricingPromoFinalCtaPrimaryBookingType: getConfiguredValue(
      configData,
      [
        "pricingPromoFinalCtaPrimaryBookingType",
        "pricingPromosFinalCtaPrimaryBookingType",
      ],
      "ticket",
    ),
    pricingPromoFinalCtaSecondaryText: getValue([
      "pricingPromoFinalCtaSecondaryText",
      "pricingPromosFinalCtaSecondaryText",
    ]),
    pricingPromoFinalCtaSecondaryBookingType: getConfiguredValue(
      configData,
      [
        "pricingPromoFinalCtaSecondaryBookingType",
        "pricingPromosFinalCtaSecondaryBookingType",
      ],
      "ticket",
    ),
    backHomeText: getValue(["cta_back_home", "backHomeText"]),
    sendAnotherText: getValue(["cta_send_another", "sendAnotherText"]),
    promotionsHeading: getValue(["promotionsHeading", "promoHeading"]),
    promotionsHeadingAccent: getValue([
      "promotionsHeadingAccent",
      "promoHeadingAccent",
    ]),
    promotionsIntro: getValue(["promotionsIntro", "promoIntro"]),
  };
}
