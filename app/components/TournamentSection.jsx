import { useMemo, useRef, useState } from "react";
import { ScoreBar } from "./ScoreBar.jsx";
import { useGsapReveal } from "../hooks/useGsapReveal.js";
import { CLASS_COLORS, formatScore, titleCase } from "../lib/format.js";

const METRICS = [
  ["macro_f1_mean", "Macro F1"],
  ["weighted_f1_mean", "Weighted F1"],
  ["accuracy_mean", "Accuracy"],
  ["balanced_accuracy_mean", "Balanced accuracy"],
  ["train_seconds_mean", "Training time"],
];

export function TournamentSection({ tournament }) {
  const [metric, setMetric] = useState("macro_f1_mean");
  const [selectedModel, setSelectedModel] = useState(tournament.leaderboard[0].model);
  const rootRef = useRef(null);
  const rows = useMemo(() => [...tournament.leaderboard].sort((a, b) => metric === "train_seconds_mean" ? a[metric] - b[metric] : b[metric] - a[metric]), [metric, tournament.leaderboard]);
  const timeMaximum = useMemo(() => Math.max(...rows.map((row) => row.train_seconds_mean)), [rows]);
  const selectedDetail = tournament.oofDetails[selectedModel];
  const folds = tournament.foldMetrics.filter((row) => row.model === selectedModel);
  const metricStem = metric.replace("_mean", "");
  useGsapReveal(rootRef, ".tournament-row", [metric]);

  return (
    <>
      <div className="chapter-heading">
        <span className="chapter-number">04 / Model tournament</span>
        <h2>Which models won under the same harness?</h2>
        <p>Every family used the same conservative table and grouped folds. F1 bars use a fixed 0–1 axis, so 0.83 occupies 83% rather than appearing full.</p>
      </div>
      <div className="tournament-controls">
        <label>
          Score
          <select value={metric} onChange={(event) => setMetric(event.target.value)}>
            {METRICS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          Inspect model
          <select value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)}>
            {tournament.leaderboard.map((row) => <option key={row.model} value={row.model}>{titleCase(row.model)}</option>)}
          </select>
        </label>
        <span className="unit-scale-note">F1 / accuracy scale: 0 → 1</span>
      </div>
      <div className="tournament-stage card-surface" ref={rootRef}>
        <div className="tournament-rows">
          {rows.map((row, position) => {
            const isTime = metric === "train_seconds_mean";
            const width = isTime ? row[metric] / timeMaximum : row[metric];
            return (
              <button key={row.model} className={`tournament-row ${position === 0 ? "best" : ""}`} type="button" onClick={() => setSelectedModel(row.model)}>
                <span className="rank">{String(position + 1).padStart(2, "0")}</span>
                <strong>{titleCase(row.model)}</strong>
                <div aria-label={isTime ? "Relative training time" : `${formatScore(row[metric])} on a zero-to-one scale`}><i style={{ "--w": `${width * 100}%` }} /></div>
                <b>{isTime ? `${formatScore(row[metric], 2)}s` : formatScore(row[metric])}</b>
                <small>{isTime ? "relative time" : `± ${formatScore(row[`${metricStem}_std`])}`}</small>
              </button>
            );
          })}
        </div>
      </div>
      <div className="model-inspector">
        <div className="inspector-heading">
          <span className="card-tag">React evidence component</span>
          <h3>{titleCase(selectedModel)}</h3>
          <p>Full OOF class metrics and five fold outcomes.</p>
        </div>
        <div className="model-detail-grid">
          <div className="card-surface">
            {selectedDetail.classMetrics.map((item) => (
              <div className="class-metric" key={item.label}>
                <strong>{titleCase(item.label)}</strong>
                <ScoreBar label="Precision" value={item.precision} color={CLASS_COLORS[item.label]} />
                <ScoreBar label="Recall" value={item.recall} color={CLASS_COLORS[item.label]} />
                <ScoreBar label="F1" value={item.f1} color={CLASS_COLORS[item.label]} />
                <small>Support {item.support.toLocaleString()}</small>
              </div>
            ))}
          </div>
          <div className="card-surface fold-spark">
            <span className="card-tag">Fold-level macro F1 / 1.0</span>
            {folds.map((fold) => (
              <div key={fold.fold}>
                <small>Fold {fold.fold}</small>
                <i style={{ "--h": `${fold.macro_f1 * 100}%` }} />
                <strong>{formatScore(fold.macro_f1)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
