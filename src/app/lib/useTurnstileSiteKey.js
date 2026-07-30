"use client";

import { useEffect, useState } from "react";

let cachedSiteKey = "";
let cachedLoaded = false;

export function useTurnstileSiteKey() {
  const [siteKey, setSiteKey] = useState(cachedLoaded ? cachedSiteKey : "");
  const [loading, setLoading] = useState(!cachedLoaded);

  useEffect(() => {
    if (cachedLoaded) return undefined;

    let alive = true;

    fetch("/api/public-config", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : {}))
      .then((config) => {
        cachedSiteKey = String(config?.turnstileSiteKey || "").trim();
        cachedLoaded = true;
        if (alive) setSiteKey(cachedSiteKey);
      })
      .catch(() => {
        cachedSiteKey = "";
        cachedLoaded = true;
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return {
    siteKey,
    turnstileEnabled: Boolean(siteKey),
    turnstileLoading: loading,
  };
}
