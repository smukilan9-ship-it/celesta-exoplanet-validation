import { useLayoutEffect } from "react";
import { gsap } from "gsap";

export function useGsapReveal(scopeRef, selector, dependencies = []) {
  useLayoutEffect(() => {
    if (!scopeRef.current) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const context = gsap.context(() => {
      gsap.fromTo(
        selector,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.045, ease: "power2.out" },
      );
    }, scopeRef);
    return () => context.revert();
  }, [scopeRef, selector, ...dependencies]);
}
