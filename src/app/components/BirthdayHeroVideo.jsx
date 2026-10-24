import DeferredVideo from "./DeferredVideo";

export default function BirthdayHeroVideo({ src, poster }) {
  return (
    <DeferredVideo
      src={src}
      className="ppp-bday-booking-hero__media"
      autoPlay
      loop
      muted
      playsInline
      poster={poster}
      aria-label="Pixel Pulse Play birthday party video with kids and teens celebrating interactive games"
    />
  );
}
