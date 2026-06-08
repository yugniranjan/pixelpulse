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

function getVideoPoster(item = {}) {
  return (
    item?.videoThumbnail ||
    item?.video_thumbnail ||
    item?.thumbnail ||
    item?.smallimage ||
    item?.headerimage ||
    ""
  );
}

const MotionImage = ({ pageData, heroData = {} }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  const item = Array.isArray(pageData) && pageData.length > 0 ? pageData[0] : pageData;
  const hasVideo = Boolean(item?.video);
  const videoPoster = getVideoPoster(item);
  const heroTitle = [heroData.headline, heroData.headlineSub].filter(Boolean).join(" ");
  const heroText = heroData.subheadline || "";
  const heroTrustItems = Array.isArray(heroData.trust)
    ? heroData.trust.filter(Boolean)
    : [];
  const hasPrimaryCtaHref = Boolean(heroData.ctaPrimaryHref);
  const isPrimaryCtaExternal = /^https?:\/\//i.test(heroData.ctaPrimaryHref || "");
  const hasPartyCta = Boolean(heroData.partyCtaText && heroData.partyCtaHref);
  const isPartyCtaExternal = /^https?:\/\//i.test(heroData.partyCtaHref || "");

  const heroCopy = (
    <div className="ppp-hero-copy">
      {heroTitle && <h1 className="ppp-hero-copy__title">{heroTitle}</h1>}
      {heroText && <p className="ppp-hero-copy__text">{heroText}</p>}
      <div className="ppp-hero-copy__actions">
        {heroData.ctaPrimary && hasPrimaryCtaHref && isPrimaryCtaExternal && (
          <a
            href={heroData.ctaPrimaryHref}
            className="ppp-btn ppp-btn--primary ppp-hero-copy__primary-cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            {heroData.ctaPrimary}
          </a>
        )}
        {heroData.ctaPrimary && hasPrimaryCtaHref && !isPrimaryCtaExternal && (
          <Link href={heroData.ctaPrimaryHref} className="ppp-btn ppp-btn--primary ppp-hero-copy__primary-cta" prefetch>
            {heroData.ctaPrimary}
          </Link>
        )}
        {heroData.ctaPrimary && !hasPrimaryCtaHref && (
          <BookingButton
            title={heroData.ctaPrimary}
            className="ppp-btn ppp-btn--primary ppp-hero-copy__primary-cta"
            bookingType="ticket"
          />
        )}
        {heroData.ctaSecondary && (
          <Link href={heroData.ctaSecondaryHref || "/attractions"} className="ppp-btn ppp-btn--outline ppp-hero-copy__secondary-cta" prefetch>
            {heroData.ctaSecondary}
          </Link>
        )}
        {hasPartyCta && isPartyCtaExternal && (
          <a
            href={heroData.partyCtaHref}
            className="ppp-btn ppp-btn--outline ppp-hero-copy__party-cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            {heroData.partyCtaText}
          </a>
        )}
        {hasPartyCta && !isPartyCtaExternal && (
          <Link href={heroData.partyCtaHref} className="ppp-btn ppp-btn--outline ppp-hero-copy__party-cta" prefetch>
            {heroData.partyCtaText}
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
          <video
            ref={videoRef}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            poster={videoPoster || undefined}
            width="100%"
          >
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
