"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ExploreChallengesCarousel({ games = [] }) {
  const carouselRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return undefined;

    let frame = 0;
    const updateActiveDot = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const slides = Array.from(carousel.querySelectorAll(".ppp-attractions__item"));
        if (!slides.length) return;

        const carouselLeft = carousel.getBoundingClientRect().left;
        const closestIndex = slides.reduce((bestIndex, slide, index) => {
          const bestDistance = Math.abs(slides[bestIndex].getBoundingClientRect().left - carouselLeft);
          const distance = Math.abs(slide.getBoundingClientRect().left - carouselLeft);
          return distance < bestDistance ? index : bestIndex;
        }, 0);

        setActiveIndex(closestIndex);
      });
    };

    updateActiveDot();
    carousel.addEventListener("scroll", updateActiveDot, { passive: true });
    window.addEventListener("resize", updateActiveDot);

    return () => {
      cancelAnimationFrame(frame);
      carousel.removeEventListener("scroll", updateActiveDot);
      window.removeEventListener("resize", updateActiveDot);
    };
  }, [games.length]);

  const goToSlide = (index) => {
    const carousel = carouselRef.current;
    const slide = carousel?.querySelectorAll(".ppp-attractions__item")?.[index];
    if (!carousel || !slide) return;

    carousel.scrollTo({
      left: slide.offsetLeft - carousel.offsetLeft,
      behavior: "smooth",
    });
    setActiveIndex(index);
  };

  if (!games.length) return null;

  return (
    <div className="ppp-attractions__carousel-wrap">
      <ul ref={carouselRef} className="ppp-attractions__grid ppp-attractions__carousel" aria-label="All game rooms">
        {games.map(({ title, body, meta, image, imageAlt, href }, i) => (
          <li key={`${title}-${i}`} className="ppp-attractions__item">
            <Link
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              prefetch={!href.startsWith("http")}
            >
              <article className="ppp-attraction-card">
                <figure className="ppp-attraction-card__fig">
                  {image && (
                    <Image
                      src={image}
                      width={400}
                      height={260}
                      alt={imageAlt || title}
                      unoptimized
                      className="ppp-attraction-card__img"
                    />
                  )}
                  <div className="ppp-attraction-card__overlay">
                    <h3 className="ppp-attraction-card__title">{title}</h3>
                    {body && <p className="ppp-attraction-card__body">{body}</p>}
                    {meta && <span className="ppp-attraction-card__meta">{meta}</span>}
                  </div>
                </figure>
              </article>
            </Link>
          </li>
        ))}
      </ul>
      {games.length > 1 && (
        <div className="ppp-attractions__dots" role="tablist" aria-label="Explore challenges carousel">
          {games.map(({ title }, i) => (
            <button
              key={`${title}-dot-${i}`}
              type="button"
              className={`ppp-attractions__dot${activeIndex === i ? " is-active" : ""}`}
              aria-label={`Show ${title}`}
              aria-current={activeIndex === i ? "true" : undefined}
              onClick={() => goToSlide(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
