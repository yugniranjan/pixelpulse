"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

const MotionImage = ({ pageData }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  if (!pageData) return null;

  const item = Array.isArray(pageData) && pageData.length > 0 ? pageData[0] : pageData;
  if (!item) return null;

  const hasVideo = Boolean(item.video);

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
          <button
            type="button"
            className="aero_home_video-toggle"
            onClick={handleToggleMute}
            aria-label={isMuted ? "Unmute hero video" : "Mute hero video"}
            aria-pressed={!isMuted}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
        </section>
      ) : (
        <motion.div />
      )}
    </section>
  );
};

export default MotionImage;
