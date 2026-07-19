import { createRoot } from "react-dom/client";
import { gsap } from "gsap";
import { GuideNav } from "./components/GuideNav.jsx";
import { LeakageComparison } from "./components/LeakageComparison.jsx";
import { TournamentSection } from "./components/TournamentSection.jsx";
import { FormulationSection } from "./components/FormulationSection.jsx";
import { EnsembleSection } from "./components/EnsembleSection.jsx";
import { EvidenceTrail } from "./components/EvidenceTrail.jsx";

const data = window.VALIDATION_DATA;
if (!data) throw new Error("Validation Experience data was not loaded before React mounted.");
const evidence = window.SUBMISSION_EVIDENCE;
if (!evidence) throw new Error("Shared submission evidence was not loaded before React mounted.");

const roots = [];
function mount(selector, component) {
  const node = document.querySelector(selector);
  if (!node) return;
  const root = createRoot(node);
  root.render(component);
  roots.push(root);
}

mount(".chapter-nav", <GuideNav />);
mount("#validationLearningPath", <EvidenceTrail />);
mount("#leakageCompare", <LeakageComparison rows={data.leakage.comparison} />);
mount("#tournament", <TournamentSection tournament={data.tournament} />);
mount("#formulations", <FormulationSection formulations={data.formulations} featureSets={data.featureSets} />);
mount("#ensemble", <EnsembleSection finalEnsemble={data.finalEnsemble} />);

window.__VALIDATION_REACT_ROOTS__ = roots;
window.__VALIDATION_RENDERER__ = "React + GSAP";

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  gsap.fromTo(".hero-copy > *", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.07, ease: "power3.out" });
  gsap.fromTo(".harness-visual", { autoAlpha: 0, x: 22, rotate: 1 }, { autoAlpha: 1, x: 0, rotate: 0, duration: 0.8, ease: "power3.out" });
}
