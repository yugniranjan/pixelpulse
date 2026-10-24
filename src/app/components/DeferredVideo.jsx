"use client";

import { useEffect, useRef, useState } from "react";

// Keep the poster in server HTML; attach media only near the viewport and after
// the initial document has loaded. Autoplay must not download offscreen videos.
export default function DeferredVideo({ src, poster, autoPlay = true, ...props }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return undefined;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const saveData = navigator.connection?.saveData;
    let timer;
    const load = () => {
      if (!reduced && !saveData) timer = window.setTimeout(() => setLoaded(true), 1200);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        if (document.readyState === "complete") load();
        else window.addEventListener("load", load, { once: true });
      }
    }, { rootMargin: "150px" });
    observer.observe(video);
    return () => { observer.disconnect(); clearTimeout(timer); window.removeEventListener("load", load); };
  }, []);
  useEffect(() => {
    if (loaded && autoPlay) ref.current?.play().catch(() => {});
  }, [loaded, autoPlay]);
  return <video {...props} ref={ref} src={loaded ? src : undefined} poster={poster} preload="none" autoPlay={loaded && autoPlay}
    onClick={() => { if (!loaded) setLoaded(true); }} />;
}
