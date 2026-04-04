"use client";
import React, { useEffect, useState } from "react";
import Modal from "./Modal";

const PromotionModal = ({ promotionPopup = [], promotions = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if ((promotionPopup?.length || 0) > 0 || (promotions?.length || 0) > 0) {
      setIsModalOpen(true);
    }
  }, [promotionPopup, promotions]);

  const closeModal = () => setIsModalOpen(false);
  const sanitizedHTML = promotionPopup[0]?.value?.replace(/<br\s*\/?>/gi, "") || "";
  const featuredPromotion = Array.isArray(promotions) ? promotions[0] : null;

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      {sanitizedHTML ? (
        <div
          dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
          className="aero_promotion_popup"
        />
      ) : featuredPromotion ? (
        <article className="aero_promotion_popup aero_promotion_popup--card">
          {featuredPromotion.badge && (
            <span className="aero_promotion_popup__badge">{featuredPromotion.badge}</span>
          )}
          <h2>{featuredPromotion.title || "Current Promotion"}</h2>
          {featuredPromotion.description && <p>{featuredPromotion.description}</p>}
          <div className="aero_promotion_popup__meta">
            {featuredPromotion.validity && (
              <time>{featuredPromotion.validity}</time>
            )}
            {featuredPromotion.code && (
              <span>Code: {featuredPromotion.code}</span>
            )}
          </div>
          {featuredPromotion.link && (
            <a
              href={featuredPromotion.link}
              className="aero_promotion_popup__cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              {featuredPromotion.linktext || "Claim Offer"}
            </a>
          )}
        </article>
      ) : null}
    </Modal>
  );
};

export default PromotionModal;
