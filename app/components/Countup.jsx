"use client";

import React, { useEffect, useRef, useState } from "react";
import CountUp from "react-countup";

const Countup = ({ num }) => {
  const [inView, setInView] = useState(false);
  const countRef = useRef(null);

  useEffect(() => {
    const refValue = countRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.5 }
    );

    if (refValue) {
      observer.observe(refValue);
    }

    return () => {
      if (refValue) {
        observer.unobserve(refValue);
      }
    };
  }, []);

  return (
    <div ref={countRef}>
      {inView ? <CountUp end={num} duration={3} separator="," /> : num} +
    </div>
  );
};

export default Countup;
