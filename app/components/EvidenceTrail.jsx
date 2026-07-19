import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

const PATH = [
  ["integrity", "01", "Trust the rows", "Identity, provenance, balance, missingness"],
  ["leakage", "02", "Remove the answer key", "Measurements stay; posterior decisions leave"],
  ["folds", "03", "Protect generalisation", "One host star belongs to one fold"],
  ["tournament", "04", "Compare fairly", "Every model enters the same harness"],
  ["experiments", "05", "Challenge the result", "Imputation, features, weights, failures"],
  ["claims", "06", "Trace the conclusion", "Claims connect to scripts and artifacts"],
];

export function EvidenceTrail() {
  const pathRef = useRef(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const context = gsap.context(() => {
      gsap.fromTo(".validation-path-grid button", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.36, stagger: 0.06, ease: "power2.out" });
    }, pathRef);
    return () => context.revert();
  }, []);

  function openSection(target) {
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="validation-learning-path" ref={pathRef} aria-labelledby="validationPathTitle">
      <div className="learning-path-heading">
        <div><span className="eyebrow">Guided evidence trail</span><h2 id="validationPathTitle">Test the result in the same order that scientific trust is built.</h2></div>
        <p>Hover to preview each checkpoint. Click to move directly to the corresponding evidence chapter.</p>
      </div>
      <div className="validation-path-grid">
        {PATH.map(([target, number, title, note]) => (
          <button key={target} type="button" onClick={() => openSection(target)}>
            <span>{number}</span><strong>{title}</strong><small>{note}</small><i>Open evidence →</i>
          </button>
        ))}
      </div>
    </section>
  );
}
