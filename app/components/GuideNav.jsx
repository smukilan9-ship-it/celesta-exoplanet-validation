import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const ITEMS = [
  ["integrity", "01 Integrity", "01 Data"],
  ["leakage", "02 Leakage", "02 Leak"],
  ["folds", "03 Folds", "03 Folds"],
  ["tournament", "04 Models", "04 Models"],
  ["ensemble", "05 Ensemble", "05 Blend"],
  ["claims", "06 Claims", "06 Claims"],
];

export function GuideNav() {
  const [active, setActive] = useState("integrity");
  const rootRef = useRef(null);

  useEffect(() => {
    const sections = ITEMS.map(([id]) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-28% 0px -58%", threshold: [0.05, 0.25, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const activeLink = rootRef.current?.querySelector("a.active");
    if (!activeLink) return undefined;
    const tween = gsap.fromTo(activeLink, { scale: 0.96 }, { scale: 1, duration: 0.24, ease: "back.out(2)" });
    return () => tween.kill();
  }, [active]);

  return (
    <div className="chapter-nav-grid" ref={rootRef}>
      {ITEMS.map(([id, label, shortLabel]) => (
        <a key={id} className={active === id ? "active" : ""} href={`#${id}`} onClick={() => setActive(id)}>
          <span className="guide-label-full">{label}</span><span className="guide-label-short">{shortLabel}</span>
        </a>
      ))}
    </div>
  );
}
