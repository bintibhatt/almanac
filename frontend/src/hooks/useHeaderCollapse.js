"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const DEFAULT_COLLAPSE_DISTANCE = 300;
const FEATHER = 24;

export function useHeaderCollapse({
  distance = DEFAULT_COLLAPSE_DISTANCE,
} = {}) {
  const headerRef = useRef(null);
  const iconRef = useRef(null);
  const trackRef = useRef(null);
  const wordmarkRef = useRef(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    const icon = iconRef.current;
    const wordmark = wordmarkRef.current;

    if (!header || !icon || !wordmark) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      const state = { eat: 0 };

      const applyMask = () => {
        const eatEdge = gsap.utils.clamp(0, 100, state.eat);

        // Initial state: fully visible
        if (eatEdge <= 0) {
          const image = `linear-gradient(
      to right,
      black 0%,
      black 100%
    )`;

          wordmark.style.maskImage = image;
          wordmark.style.webkitMaskImage = image;
          return;
        }

        // Final state: fully hidden
        if (eatEdge >= 100) {
          const image = `linear-gradient(
      to right,
      transparent 100%,
      transparent 100%
    )`;

          wordmark.style.maskImage = image;
          wordmark.style.webkitMaskImage = image;
          return;
        }

        const feather = Math.min(FEATHER, 100 - eatEdge);
        const featherStart = Math.max(0, eatEdge - feather);

        const gradient = `
    linear-gradient(
      to right,
      transparent ${featherStart}%,
      rgba(0,0,0,.2) ${featherStart + feather * 0.3}%,
      rgba(0,0,0,.6) ${featherStart + feather * 0.7}%,
      black ${eatEdge}%,
      black 100%
    )
  `;

        wordmark.style.maskImage = gradient;
        wordmark.style.webkitMaskImage = gradient;
      };

      applyMask();

      const tl = gsap.timeline({
        defaults: {
          ease: "none",
        },
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: `+=${distance}`,
          scrub: 0.15, // smoother than 0.4
        },
      });

      tl.fromTo(
        wordmark,
        {
          xPercent: 0,
          scale: 1,
          transformOrigin: "left center",
        },
        {
          xPercent: -42, // less movement
          scale: 0.985, // tiny compression
          force3D: true,
        },
        0,
      );

      tl.fromTo(
        state,
        { eat: 0 },
        {
          eat: 100,
          ease: "power2.out",
          onUpdate: applyMask,
        },
        0,
      );

      tl.fromTo(
        icon,
        {
          scale: 1,
          rotation: 0,
        },
        {
          scale: 1.035,
          force3D: true,
        },
        0,
      );

      tl.fromTo(
        header,
        {
          paddingTop: 8,
          paddingBottom: 8,
          minHeight: 56,
        },
        {
          paddingTop: 6,
          paddingBottom: 6,
          minHeight: 48,
        },
        0,
      );
    }, header);

    return () => {
      ctx.revert();

      wordmark.style.maskImage = "";
      wordmark.style.webkitMaskImage = "";
    };
  }, [distance]);

  return {
    headerRef,
    iconRef,
    trackRef,
    wordmarkRef,
  };
}
