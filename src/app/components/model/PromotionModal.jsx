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
  const popupPromotions = Array.isArray(promotions) ? promotions.slice(0, 2) : [];

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      {sanitizedHTML ? (
        <div
          dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
          className="aero_promotion_popup"
        />
      ) : popupPromotions.length > 0 ? (
        <section className="aero_promotion_popup_grid">
          {popupPromotions.map((promotion, index) => (
            <article className="aero_promotion_popup aero_promotion_popup--card" key={index}>
              {promotion.badge && (
                <span className="aero_promotion_popup__badge">{promotion.badge}</span>
              )}
              <h2>{promotion.title || "Current Promotion"}</h2>
              {promotion.description && <p>{promotion.description}</p>}
              <div className="aero_promotion_popup__meta">
                {promotion.validity && <time>Valid: {promotion.validity}</time>}
                {promotion.code && <span>Code: {promotion.code}</span>}
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
        </section>
      ) : null}
    </Modal>
  );
};

export default PromotionModal;
