"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import BookingButton from "./smallComponents/BookingButton";

function formatHeroTrustItem(item = "") {
  return String(item || "")?.replace(
    /\b(interactive|immersive)\b/gi,
    (word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`,
  );
}

const MotionImage = ({ pageData, heroData = {} }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  const item = Array.isArray(pageData) && pageData.length > 0 ? pageData[0] : pageData;
  const hasVideo = Boolean(item?.video);
  const heroTitle = [heroData.headline, heroData.headlineSub].filter(Boolean).join(" ");
  const heroText = heroData.subheadline || "";
  const heroTrustItems = Array.isArray(heroData.trust)
    ? heroData.trust.filter(Boolean)
    : [];

  const heroCopy = (
    <div className="ppp-hero-copy">
      {heroTitle && <h1 className="ppp-hero-copy__title">{heroTitle}</h1>}
      {heroText && <p className="ppp-hero-copy__text">{heroText}</p>}
      <div className="ppp-hero-copy__actions">
        {heroData.ctaPrimary && (
          <BookingButton
            title={heroData.ctaPrimary}
            className="ppp-btn ppp-btn--primary"
            bookingType="ticket"
          />
        )}
        {heroData.ctaSecondary && (
          <Link href={heroData.ctaSecondaryHref || "/attractions"} className="ppp-btn ppp-btn--outline" prefetch>
            {heroData.ctaSecondary}
          </Link>
        )}
      </div>
      {heroTrustItems.length > 0 && (
        <div className="ppp-hero-copy__trust" aria-label="Hero highlights">
          {heroTrustItems.map((item, index) => (
            <span className="ppp-hero-copy__trust-item" key={`${item}-${index}`}>
              <span className="ppp-hero-copy__trust-star" aria-hidden="true">
                *
              </span>
              {formatHeroTrustItem(item)}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const handleToggleMute = async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (videoRef.current) {
      videoRef.current.muted = nextMuted;

      if (!nextMuted) {
        try {
          await videoRef.current.play();
        } catch (error) {
          console.error("hero video playback failed:", error);
        }
      }
    }
  };

  return (
    <section className="aero_home-headerimg-wrapper">
      {hasVideo ? (
        <section className="aero_home_video-container">
          <video ref={videoRef} autoPlay muted={isMuted} loop playsInline width="100%">
            <source src={item.video} type="video/mp4" />
          </video>
          {heroCopy}
          <button
            type="button"
            className="aero_home_video-toggle"
            onClick={handleToggleMute}
            aria-label={isMuted ? "Unmute hero video" : "Mute hero video"}
            aria-pressed={!isMuted}
          >
            {isMuted ? <IoVolumeMute aria-hidden="true" /> : <IoVolumeHigh aria-hidden="true" />}
          </button>
        </section>
      ) : (
        <section className="aero_home_video-container ppp-hero-fallback">
          <motion.div />
          {heroCopy}
        </section>
      )}
    </section>
  );
};

export default MotionImage;
