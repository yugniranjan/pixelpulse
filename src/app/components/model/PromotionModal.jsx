"use client";
import React, { useEffect, useState } from "react";
import Modal from "./Modal";

const PromotionModal = ({
  promotionPopup = [],
  promotions = [],
  delayMs = 0,
  claimOfferText = "",
}) => {
  const sessionKey = "pixelpulse-promotion-popup-dismissed";
  const sanitizedHTML = promotionPopup[0]?.value?.replace(/<br\s*\/?>/gi, "") || "";
  const hasPopupContent = sanitizedHTML.trim() !== "";
  const hasPromotionRows = Array.isArray(promotions)
    ? promotions.some((promo) =>
        Object.values(promo || {}).some(
          (value) => typeof value === "string" && value.trim() !== ""
        )
      )
    : false;
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const hasContent = hasPopupContent || hasPromotionRows;

    if (!hasContent) {
      setIsModalOpen(false);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(sessionKey);
      }
      return undefined;
    }

    const isDismissed =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(sessionKey) === "true";

    if (isDismissed) {
      setIsModalOpen(false);
      return undefined;
    }

    let timeout;
    const openWhenClear = () => {
      if (document.querySelector(".pixieplay__panel, .pixieplay__invite")) {
        timeout = window.setTimeout(openWhenClear, 1000);
        return;
      }
      setIsModalOpen(true);
    };
    timeout = window.setTimeout(openWhenClear, delayMs);

    return () => window.clearTimeout(timeout);
  }, [delayMs, hasPopupContent, hasPromotionRows]);

  const closeModal = () => {
    setIsModalOpen(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(sessionKey, "true");
    }
  };
  const visiblePromotions = Array.isArray(promotions)
    ? promotions.filter((promo) =>
        Object.values(promo || {}).some(
          (value) => typeof value === "string" && value.trim() !== ""
        )
      )
    : null;

  if (!hasPopupContent && !hasPromotionRows) {
    return null;
  }

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      titleId="promotion-modal-title"
      ariaLabel="Current promotions"
    >
      <section className="aero_promotion_shell">
        <div className="aero_promotion_backdrop" aria-hidden="true">
          <span className="aero_promotion_backdrop__orb aero_promotion_backdrop__orb--one" />
          <span className="aero_promotion_backdrop__orb aero_promotion_backdrop__orb--two" />
          <span className="aero_promotion_backdrop__orb aero_promotion_backdrop__orb--three" />
          <span className="aero_promotion_backdrop__grid" />
        </div>

        

        {sanitizedHTML ? (
          <>
            <h2 id="promotion-modal-title" className="sr-only">Current promotions</h2>
            <div
              dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
              className="aero_promotion_popup"
            />
          </>
        ) : visiblePromotions?.length ? (
          <div className="aero_promotion_popup_grid">
            <h2 id="promotion-modal-title" className="sr-only">Current promotions</h2>
            {visiblePromotions.map((promotion, index) => (
              <article
                key={`${promotion.title || "promotion"}-${index}`}
                className="aero_promotion_popup aero_promotion_popup--card"
              >
                <div className="aero_promotion_popup__topline">
                  <span className="aero_promotion_popup__eyebrow">Featured Deal</span>
                  {promotion.badge && (
                    <span className="aero_promotion_popup__badge">{promotion.badge}</span>
                  )}
                </div>
                <h3>{promotion.title || "Current Promotion"}</h3>
                {promotion.description && <p>{promotion.description}</p>}
                <div className="aero_promotion_popup__meta">
                  {promotion.validity && (
                    <span className="aero_promotion_popup__meta_item">
                      Valid: <time>{promotion.validity}</time>
                    </span>
                  )}
                  {promotion.code && (
                    <span className="aero_promotion_popup__meta_item">
                      Code: <strong>{promotion.code}</strong>
                    </span>
                  )}
                </div>
                {promotion.link && (promotion.linktext || claimOfferText) && (
                  <a
                    href={promotion.link}
                    className="aero_promotion_popup__cta"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {promotion.linktext || claimOfferText}
                  </a>
                )}
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </Modal>
  );
};

export default PromotionModal;
