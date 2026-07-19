import { useMemo, useRef, useState } from "react";
import { ScoreBar } from "./ScoreBar.jsx";
import { useGsapReveal } from "../hooks/useGsapReveal.js";
import { formatScore, titleCase } from "../lib/format.js";

export function FormulationSection({ formulations, featureSets }) {
  const [selectedId, setSelectedId] = useState("direct");
  const cardsRef = useRef(null);
  const items = useMemo(() => {
    const topBinary = formulations.binary[0];
    const topHybrid = [...formulations.hybrid].sort((a, b) => b.macro_f1 - a.macro_f1)[0];
    const topHierarchy = [...formulations.hierarchy].sort((a, b) => b.macro_f1 - a.macro_f1)[0];
    const topRescue = [...formulations.rescue].sort((a, b) => b.macro_f1 - a.macro_f1)[0];
    return [
      { id: "direct", label: "Direct three-class", score: formulations.directMacroF1, task: "Candidate, Confirmed, False Positive", note: "Native headline task", detail: "All 9,564 rows remain in the task. The final selected ensemble is evaluated with grouped OOF predictions." },
      { id: "binary", label: "Resolved-only binary", score: topBinary.binary_macro_f1_mean, task: "7,586 rows · Confirmed vs False Positive", note: "1,978 Candidates removed", detail: "This 0.9775 result is reported as a strong secondary benchmark. It cannot be ranked directly against the 0.8363 three-class result because the target, evaluated rows, and number of averaged classes are different." },
      { id: "hybrid", label: "Binary threshold hybrid", score: topHybrid.macro_f1, task: "Three labels via threshold", note: "Not the direct task", detail: `The strongest hybrid uses ${titleCase(topHybrid.model)} at threshold ${topHybrid.threshold}; it remains below the direct ensemble.` },
      { id: "hierarchy", label: "Candidate-first hierarchy", score: topHierarchy.macro_f1, task: "Candidate detector → resolved model", note: "Below headline", detail: "A dedicated Candidate front door did not find a clean enough boundary to beat the direct ensemble." },
      { id: "rescue", label: "Binary residual rescue", score: topRescue.macro_f1, task: "Binary confidence + rescue", note: "Exploratory", detail: "The nested version only moved macro F1 by a tiny amount, so the base ensemble remains the headline." },
    ];
  }, [formulations]);
  const selected = items.find((item) => item.id === selectedId);
  const conservative = featureSets.conservative.find((row) => row.model === "lightgbm_balanced");
  const reduced = featureSets.reduced.find((row) => row.model === "lightgbm_balanced");
  useGsapReveal(cardsRef, ".formulation-card", []);

  return (
    <>
      <div className="chapter-heading">
        <span className="chapter-number">05 / Problem formulation</span>
        <h2>Does the experiment solve the actual question?</h2>
        <p>Binary Confirmed-versus-False-Positive classification is easier. It is not the same task as retaining Candidate as a real third class.</p>
      </div>
      <div className="formulation-comparison-rule"><span>Score comparison rule</span><p><strong>0.9775 binary macro F1</strong> uses 7,586 resolved rows and averages two classes. <strong>0.8363 three-class macro F1</strong> uses all 9,564 rows and averages three classes. A higher binary score is valid for its declared task, but it is not evidence of better performance on Candidate.</p></div>
      <div className="formulation-cards" ref={cardsRef}>
        {items.map((item) => (
          <button key={item.id} className={`formulation-card ${selectedId === item.id ? "active" : ""}`} type="button" onClick={() => setSelectedId(item.id)}>
            <span>{item.note}</span><strong>{item.label}</strong><em>{formatScore(item.score)} macro F1</em><small>{item.task}</small>
          </button>
        ))}
      </div>
      <div className="card-surface formulation-detail">
        <span className="card-tag">React formulation component</span>
        <h3>{selected.label}</h3>
        <p>{selected.detail}</p>
        <ScoreBar label="Reported macro F1" value={selected.score} color={selected.id === "direct" ? "var(--lime)" : "var(--amber)"} />
      </div>
      <div className="feature-set-stage card-surface">
        <div className="panel-head"><div><span className="card-tag">98 vs 59 features</span><h3>Interpretability cost: <span>{formatScore(featureSets.deltaMacroF1, 3)}</span> macro F1</h3></div><button className="concept-chip" data-open-concept="featureSet" type="button">Compare the tables <i>?</i></button></div>
        <div className="feature-compare">
          <article><span>98 FEATURE CONSERVATIVE</span><strong>{formatScore(conservative.macro_f1_mean)}</strong><p>Retains uncertainties and diagnostics while excluding target proxies.</p></article>
          <div className="compare-arrow">−{formatScore(featureSets.deltaMacroF1, 3)}</div>
          <article><span>59 FEATURE REDUCED</span><strong>{formatScore(reduced.macro_f1_mean)}</strong><p>Smaller, more interpretable scientific measurement set.</p></article>
        </div>
      </div>
    </>
  );
}
