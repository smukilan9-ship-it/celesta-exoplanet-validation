import { memo, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { formatScore } from "../lib/format.js";

export const ScoreBar = memo(function ScoreBar({ label, value, color = "var(--ink)", note = "", scale = "unit", maximum = 1 }) {
  const fillRef = useRef(null);
  const numericValue = Number(value);
  const ratio = scale === "relative" ? numericValue / maximum : numericValue;
  const width = Math.max(0, Math.min(1, ratio)) * 100;

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      fillRef.current.style.width = `${width}%`;
      return undefined;
    }
    const tween = gsap.fromTo(fillRef.current, { width: 0 }, { width: `${width}%`, duration: 0.55, ease: "power2.out" });
    return () => tween.kill();
  }, [width]);

  return (
    <div className="score-line" data-scale={scale === "unit" ? "0–1" : "relative"}>
      <span>{label}</span>
      <div className="score-track" aria-label={`${label}: ${formatScore(numericValue)} on a zero-to-one scale`}>
        <i ref={fillRef} style={{ "--fill": color }} />
      </div>
      <strong>{formatScore(numericValue)}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
});
