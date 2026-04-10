"use client";
import React, { useEffect, useState } from "react";
import Modal from "./Modal";

const PromotionModal = ({ promotionPopup = [], promotions = [] }) => {
  const sessionKey = "pixelpulse-promotion-popup-dismissed";
  const hasPromotionRows = Array.isArray(promotions)
    ? promotions.some((promo) =>
        Object.values(promo || {}).some(
          (value) => typeof value === "string" && value.trim() !== ""
        )
      )
    : false;
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (hasPromotionRows) {
      const isDismissed =
        typeof window !== "undefined" &&
        window.sessionStorage.getItem(sessionKey) === "true";
      setIsModalOpen(!isDismissed);
    } else {
      setIsModalOpen(false);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(sessionKey);
      }
    }
  }, [hasPromotionRows]);

  const closeModal = () => {
    setIsModalOpen(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(sessionKey, "true");
    }
  };
  const sanitizedHTML = promotionPopup[0]?.value?.replace(/<br\s*\/?>/gi, "") || "";
  const visiblePromotions = Array.isArray(promotions)
    ? promotions.filter((promo) =>
        Object.values(promo || {}).some(
          (value) => typeof value === "string" && value.trim() !== ""
        )
      )
    : null;

  if (!hasPromotionRows) {
    return null;
  }

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      <section className="aero_promotion_shell">
        <div className="aero_promotion_backdrop" aria-hidden="true">
          <span className="aero_promotion_backdrop__orb aero_promotion_backdrop__orb--one" />
          <span className="aero_promotion_backdrop__orb aero_promotion_backdrop__orb--two" />
          <span className="aero_promotion_backdrop__orb aero_promotion_backdrop__orb--three" />
          <span className="aero_promotion_backdrop__grid" />
        </div>

        

        {sanitizedHTML ? (
          <div
            dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
            className="aero_promotion_popup"
          />
        ) : visiblePromotions?.length ? (
          <div className="aero_promotion_popup_grid">
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
                {promotion.link && (
                  <a
                    href={promotion.link}
                    className="aero_promotion_popup__cta"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {promotion.linktext || "Claim Offer"}
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
