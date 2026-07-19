import { useMemo, useRef, useState } from "react";
import { useGsapReveal } from "../hooks/useGsapReveal.js";
import { formatPercent, formatScore, titleCase } from "../lib/format.js";

const PROBABILITY_LABELS = [
  ["CANDIDATE", "candidate"],
  ["CONFIRMED", "confirmed"],
  ["FALSE POSITIVE", "false_positive"],
];

export function EnsembleSection({ finalEnsemble }) {
  const examples = useMemo(() => [...finalEnsemble.componentRows].sort((a, b) => Number(a.correct) - Number(b.correct)).slice(0, 12), [finalEnsemble.componentRows]);
  const [selectedRowId, setSelectedRowId] = useState(examples[0].rowid);
  const [query, setQuery] = useState("");
  const mathRef = useRef(null);
  const selectedRow = finalEnsemble.componentRows.find((row) => row.rowid === Number(selectedRowId)) || examples[0];
  useGsapReveal(mathRef, ".probability-line", [selectedRow.rowid]);

  function submitSearch(event) {
    event.preventDefault();
    const term = query.trim().toLowerCase();
    const match = finalEnsemble.componentRows.find((row) => String(row.rowid) === term || row.kepoi_name.toLowerCase().includes(term));
    if (match) setSelectedRowId(match.rowid);
  }

  return (
    <>
      <div className="chapter-heading">
        <span className="chapter-number">07 / Final ensemble</span>
        <h2>Why this final blend?</h2>
        <p>Two complementary boosted-tree models combine real held-out probabilities. Select any saved KOI to inspect the arithmetic.</p>
      </div>
      <div className="ensemble-weights">
        <article><span>LightGBM</span><strong>{formatPercent(finalEnsemble.weights.lightgbm)}</strong><i style={{ "--w": `${finalEnsemble.weights.lightgbm * 100}%` }} /></article>
        <b>+</b>
        <article><span>CatBoost</span><strong>{formatPercent(finalEnsemble.weights.catboost)}</strong><i style={{ "--w": `${finalEnsemble.weights.catboost * 100}%` }} /></article>
        <b>=</b>
        <article className="blend"><span>Soft vote</span><strong>{formatScore(finalEnsemble.metrics.macro_f1)}</strong><small>macro F1</small></article>
      </div>
      <div className="ensemble-inspector card-surface">
        <div className="inspector-toolbar">
          <form onSubmit={submitSearch} className="ensemble-search-form">
            <label>Find a KOI<input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="K00752.01 or row ID" /></label>
            <button className="outline-button" type="submit">Find</button>
          </form>
          <label>Example<select value={examples.some((row) => row.rowid === Number(selectedRowId)) ? selectedRowId : ""} onChange={(event) => setSelectedRowId(Number(event.target.value))}><option value="" disabled>Search result</option>{examples.map((row) => <option key={row.rowid} value={row.rowid}>{row.kepoi_name} · {row.actual} → {row.predicted}</option>)}</select></label>
          <a className="outline-button" href="data/final_ensemble_component_oof.csv" download>Download component OOF ↧</a>
        </div>
        <div ref={mathRef}>
          <div className="koid-head"><span>KOI {selectedRow.kepoi_name} / held-out fold {selectedRow.fold}</span><strong className={selectedRow.correct ? "correct" : "wrong"}>{selectedRow.actual} → {selectedRow.predicted} {selectedRow.correct ? "✓" : "×"}</strong></div>
          <p className="equation">0.6364 × LightGBM probability + 0.3636 × CatBoost probability = displayed blended probability</p>
          {PROBABILITY_LABELS.map(([label, key]) => {
            const lightgbm = selectedRow[`lightgbm_balanced_${key}`];
            const catboost = selectedRow[`catboost_balanced_${key}`];
            const blended = selectedRow[`blended_${key}`];
            return (
              <div className="probability-line" key={key}>
                <span>{titleCase(label)}</span>
                <div className="member-prob"><small>LGBM {formatPercent(lightgbm)}</small><i style={{ "--w": `${lightgbm * 100}%`, "--fill": "var(--blue)" }} /></div>
                <div className="member-prob"><small>Cat {formatPercent(catboost)}</small><i style={{ "--w": `${catboost * 100}%`, "--fill": "var(--orange)" }} /></div>
                <strong>{formatPercent(blended)}<small>weighted</small></strong>
              </div>
            );
          })}
          <div className="inspector-proof">The displayed weighted probabilities reproduce the saved uncalibrated OOF ensemble exactly.</div>
        </div>
      </div>
    </>
  );
}
