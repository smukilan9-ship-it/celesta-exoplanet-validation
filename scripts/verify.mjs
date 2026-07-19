import { readFile } from "node:fs/promises";

const data = JSON.parse(await readFile(new URL("../data/validation_data.json", import.meta.url), "utf8"));
const rows = await readFile(new URL("../data/final_ensemble_component_oof.csv", import.meta.url), "utf8");
const evidence = await readFile(new URL("../shared/submission-evidence.js", import.meta.url), "utf8");

if (data.summary.rows !== 9564) throw new Error("Expected all 9,564 validation rows.");
if (data.summary.classCounts.CANDIDATE !== 1978) throw new Error("Candidate count drifted.");
if (Math.abs(data.finalEnsemble.metrics.macro_f1 - 0.8363262609244471) > 1e-12) {
  throw new Error("Headline macro F1 drifted.");
}
const weights = data.finalEnsemble.weights;
if (Math.abs(Object.values(weights).reduce((sum, value) => sum + value, 0) - 1) > 1e-12) {
  throw new Error("Ensemble weights do not sum to one.");
}
if (rows.trim().split("\n").length !== 9565) throw new Error("Component OOF row count drifted.");
if (!evidence.includes("window.SUBMISSION_EVIDENCE")) throw new Error("Shared evidence bundle is invalid.");

console.log("Validation evidence verified: 9,564 held-out rows and locked ensemble metrics.");
