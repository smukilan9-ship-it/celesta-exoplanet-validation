import { useRef } from "react";
import { useGsapReveal } from "../hooks/useGsapReveal.js";
import { formatScore, titleCase } from "../lib/format.js";

export function LeakageComparison({ rows }) {
  const rootRef = useRef(null);
  useGsapReveal(rootRef, "article", [rows]);

  return (
    <div ref={rootRef}>
      {rows.map((row) => (
        <article key={row.dataset}>
          <span>{titleCase(row.dataset)}</span>
          <div aria-label={`${formatScore(row.macro_f1)} macro F1 on a zero-to-one scale`}>
            <i style={{ "--w": `${row.macro_f1 * 100}%` }} />
          </div>
          <strong>{formatScore(row.macro_f1)}</strong>
          <small>macro F1 / 1.0</small>
        </article>
      ))}
    </div>
  );
}
