"use client";

import { useRef, useState } from "react";
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa";

export default function BirthdayHeroVideo({ src, poster }) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleAudio = () => {
    const nextMuted = !isMuted;
    const video = videoRef.current;

    if (video) {
      video.muted = nextMuted;
      video.play().catch(() => {});
    }

    setIsMuted(nextMuted);
  };

  return (
    <>
      <video
        ref={videoRef}
        className="ppp-bday-booking-hero__media"
        autoPlay
        loop
        muted={isMuted}
        playsInline
        poster={poster}
        aria-label="Pixel Pulse Play birthday party video with kids and teens celebrating interactive games"
      >
        <source src={src} type="video/mp4" />
      </video>
      <button
        className="ppp-bday-booking-hero__sound"
        type="button"
        onClick={toggleAudio}
        aria-label={isMuted ? "Play hero video sound" : "Mute hero video sound"}
        title={isMuted ? "Play sound" : "Mute audio"}
      >
        {isMuted ? <FaVolumeMute aria-hidden="true" /> : <FaVolumeUp aria-hidden="true" />}
        <span>{isMuted ? "Play sound" : "Mute audio"}</span>
      </button>
    </>
  );
}
