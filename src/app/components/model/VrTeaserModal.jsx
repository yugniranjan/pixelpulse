"use client";

import React, { useEffect, useState } from "react";
import Modal from "./Modal";

const SESSION_KEY = "pixelpulse-vr-teaser-dismissed";

function hashValue(value = "") {
  return String(value || "")
    .split("")
    .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)
    .toString(36);
}

function sanitizePopupHtml(html = "") {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+=(["']).*?\1/gi, "");
}

const VrTeaserModal = ({ config = {} }) => {
  const {
    show = false,
    html = "",
    delayMs = 3200,
    autoDismissMs = 10000,
    maxWidth = 560,
  } = config;
  const [isOpen, setIsOpen] = useState(false);
  const sanitizedHTML = sanitizePopupHtml(html);
  const sessionKey = `${SESSION_KEY}:${hashValue(sanitizedHTML)}`;

  useEffect(() => {
    let isCancelled = false;
    let retryTimeout;
    if (!show || !sanitizedHTML) return undefined;

    const dismissed =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(sessionKey) === "true";

    if (dismissed) return undefined;

    const openWhenClear = () => {
      if (isCancelled) return;

      if (document.querySelector(".modal-overlay")) {
        retryTimeout = window.setTimeout(openWhenClear, 2400);
        return;
      }

      setIsOpen(true);
    };

    const timeout = window.setTimeout(openWhenClear, delayMs);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeout);
      window.clearTimeout(retryTimeout);
    };
  }, [delayMs, sanitizedHTML, sessionKey, show]);

  const closeModal = () => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(sessionKey, "true");
    }
  };

  useEffect(() => {
    if (!isOpen || !autoDismissMs) return undefined;

    const timeout = window.setTimeout(() => {
      setIsOpen(false);
    }, autoDismissMs);
    return () => window.clearTimeout(timeout);
  }, [autoDismissMs, isOpen]);

  if (!show || !sanitizedHTML) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      titleId="vr-teaser-modal-title"
      ariaLabel="VR teaser"
      contentStyle={{ "--ppp-vr-popup-width": `${maxWidth}px` }}
    >
      <section
        className="ppp-vr-teaser-html"
        dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      />
    </Modal>
  );
};

export default VrTeaserModal;
