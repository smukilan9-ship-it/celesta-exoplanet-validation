(function () {
  const data = window.VALIDATION_DATA;
  if (!data) throw new Error("Validation Experience data was not loaded.");
  const config = window.VALIDATION_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const pct = (value, digits = 1) => `${(Number(value) * 100).toFixed(digits)}%`;
  const fmt = (value, digits = 4) => Number(value).toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
  const title = (value) => String(value).replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (char) => char.toUpperCase());
  const escapeHtml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const classColors = { CANDIDATE: "var(--lime)", CONFIRMED: "var(--blue)", "FALSE POSITIVE": "var(--coral)" };
  let activeConfusion = { actual: "CANDIDATE", predicted: "FALSE POSITIVE" };
  let previousFocus = null;

  const concepts = {
    oof: ["Out-of-fold evidence", "Every row was predicted by a model that did not train on it.", "The five folds train on four host-star-separated sections of the dataset and predict the fifth. Stitched together, these predictions form one held-out decision for every KOI.", "OOF evidence is appropriate for reporting the model result and inspecting errors. It is not permission to repeatedly tune a new rule against the same errors and call that a fresh score."],
    imbalance: ["Macro F1", "Macro F1 gives the difficult Candidate class an equal vote.", "Accuracy is dominated by the largest class, False Positive. Macro F1 computes F1 separately for Candidate, Confirmed, and False Positive, then averages them equally.", "That is why it remains the headline metric: a model cannot hide weak Candidate performance inside a strong overall accuracy."],
    missingness: ["Fold-safe missingness", "Missing values must be handled without seeing the held-out fold.", "The conservative table intentionally preserves missing values. Every imputer or missingness indicator is fit only within a training fold, then applied to its held-out rows.", "This prevents information from the validation fold leaking into preprocessing."],
    groupedFold: ["StratifiedGroupKFold", "A host star must never be split between training and validation.", "Multiple KOIs can belong to one kepid. A row-wise split could let a model learn the host star's context in training and then appear to generalize when it sees a sibling KOI.", "Grouping by kepid prevents that. Stratification still keeps Candidate, Confirmed, and False Positive represented in every fold."],
    featureSet: ["Feature-table comparison", "The reduced table trades performance for a smaller, easier-to-explain input set.", "Both tables exclude target proxies and vetting outcomes. The 98-feature table additionally retains useful uncertainties and diagnostics; the 59-feature set concentrates on interpretable orbital, transit, stellar, and magnitude measurements.", "The comparison is a scientific trade-off, not a leakage comparison."],
    nested: ["Nested validation", "A tuning decision needs a second layer of protection.", "If a threshold is selected using the same OOF predictions used for reporting, it can look better by chance. Nested validation chooses the rule inside each outer training portion, then tests it once on an untouched outer fold.", "The nested rescue gain was tiny, so the simpler base ensemble remains the headline."],
  };

  function openDrawer(eyebrow, heading, body) {
    previousFocus = document.activeElement;
    $("#drawerEyebrow").textContent = eyebrow;
    $("#drawerTitle").textContent = heading;
    $("#drawerBody").innerHTML = body;
    $("#detailDrawer").classList.add("open");
    $("#detailDrawer").setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
    $(".close-drawer").focus();
  }
  function closeDrawer() {
    $("#detailDrawer").classList.remove("open");
    $("#detailDrawer").setAttribute("aria-hidden", "true");
    document.body.classList.remove("drawer-open");
    if (previousFocus?.focus) previousFocus.focus();
  }
  function concept(key) { const item = concepts[key]; if (item) openDrawer(item[0], item[1], `<p>${item[2]}</p><p>${item[3]}</p>`); }
  function scoreBar(label, value, color = "var(--ink)", note = "") {
    return `<div class="score-line"><span>${escapeHtml(label)}</span><div class="score-track"><i style="--w:${Math.max(0, Number(value) * 100)}%;--fill:${color}"></i></div><strong>${typeof value === "number" ? fmt(value) : value}</strong>${note ? `<small>${escapeHtml(note)}</small>` : ""}</div>`;
  }
  function metricCard(label, value, note, accent = "") {
    return `<article class="metric-card ${accent}"><span class="mini-label">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><p>${escapeHtml(note)}</p></article>`;
  }

  function initLinks() {
    const integrated = location.pathname.includes("validation-experience");
    if (config.learnerUrl) $$('[data-learner-link]').forEach((link) => { link.href = config.learnerUrl; });
    if (config.candidateLabUrl) $$('[data-lab-link]').forEach((link) => { link.href = config.candidateLabUrl; });
    if (!integrated && !config.learnerUrl) $$('[data-learner-link]').forEach((link) => { link.hidden = true; });
    if (!integrated && !config.candidateLabUrl) $$('[data-lab-link],[data-open-lab]').forEach((link) => { link.hidden = true; });
    $$('[data-open-lab]').forEach((button) => button.addEventListener("click", () => { location.href = config.candidateLabUrl || "../candidate-error-lab/"; }));
  }
  function initGuide() {
    const guide = $(".guide-bar"); const reopen = $(".guide-reopen");
    $(".collapse-guide").addEventListener("click", () => { guide.classList.add("collapsed"); reopen.classList.add("show"); });
    reopen.addEventListener("click", () => { guide.classList.remove("collapsed"); reopen.classList.remove("show"); });
    const nav = $$(".chapter-nav a");
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) nav.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`)); }), { rootMargin: "-35% 0px -58%" });
    $$(".chapter").forEach((section) => observer.observe(section));
  }
  function drawSky() {
    const canvas = $(".sky-canvas"); const ctx = canvas.getContext("2d");
    function paint() {
      canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; ctx.scale(devicePixelRatio, devicePixelRatio); ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.strokeStyle = "rgba(17,17,17,.06)"; ctx.lineWidth = 1;
      for (let x = -innerHeight; x < innerWidth + innerHeight; x += 46) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - innerHeight, innerHeight); ctx.stroke(); }
      ctx.fillStyle = "rgba(201,242,93,.18)"; ctx.beginPath(); ctx.arc(innerWidth * .82, innerHeight * .2, Math.min(260, innerWidth * .2), 0, Math.PI * 2); ctx.fill();
    }
    paint(); addEventListener("resize", paint, { passive: true });
  }
  function renderHeadline() {
    const final = data.finalEnsemble.metrics;
    $("#heroRows").textContent = data.summary.rows.toLocaleString();
    $("#headlineFacts").innerHTML = [
      ["Leakage-conservative", `${data.summary.conservativeFeatures} features`, "target proxies removed"],
      ["Grouped evidence", "5 held-out folds", `${data.summary.uniqueKepid.toLocaleString()} host stars`],
      ["Final macro F1", fmt(final.macro_f1), "same native three-class task"],
      ["Probability reliability", fmt(final.ece), "ECE after temperature scaling"],
    ].map(([label, value, note]) => `<div><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join("");
  }
  function renderIntegrity() {
    const summary = data.summary;
    $("#integrityMetrics").innerHTML = [
      metricCard("Raw catalog", `${summary.rows.toLocaleString()} KOIs`, `${summary.originalColumns} original columns`),
      metricCard("Conservative table", `${summary.conservativeFeatures} features`, "target proxies excluded", "lime"),
      metricCard("Reduced scientific table", `${summary.reducedFeatures} features`, "interpretability comparison"),
      metricCard("Host-star groups", summary.uniqueKepid.toLocaleString(), `${summary.multiKoiHosts.toLocaleString()} hosts contain multiple KOIs`),
    ].join("");
    $("#classDistribution").innerHTML = Object.entries(summary.classCounts).map(([label, count]) => `<button class="class-band" data-class="${label}" style="--color:${classColors[label]};--w:${count / summary.rows * 100}%"><span>${title(label)}</span><strong>${count.toLocaleString()}</strong><i></i><small>${pct(count / summary.rows)}</small></button>`).join("");
    $$(".class-band").forEach((button) => button.addEventListener("click", () => { const label = button.dataset.class; const count = summary.classCounts[label]; openDrawer(`${title(label)} class`, `${count.toLocaleString()} rows in the catalog`, `<p>${data.integrity.target.meaning}</p><p>This class represents ${pct(count / summary.rows)} of all KOIs. Its support is preserved in every grouped validation fold.</p>`); }));
    $("#provenanceCard").innerHTML = `<span class="card-tag">Dataset provenance</span><h3>One competition table; one NASA reference.</h3><p>${data.integrity.provenance.competition}. The NASA reference table is used for provenance and leakage checks, not as an extra training source.</p><button class="text-action" data-open-concept="oof">Read validation standard →</button>`;
    $("#identityCard").innerHTML = `<span class="card-tag">Identity and column checks</span><h3>Rows are KOIs, not unique stars.</h3><p><strong>${summary.uniqueKepoiNames.toLocaleString()}</strong> unique KOI identities; <strong>${summary.exactDuplicateRows}</strong> exact duplicate raw rows; <strong>${summary.uniqueKepid.toLocaleString()}</strong> host-star identities used only for grouping.</p><p><strong>${data.integrity.allMissing.length}</strong> all-missing and <strong>${data.integrity.constant.length}</strong> constant fields were removed before model fitting.</p><button class="text-action" data-open-concept="groupedFold">Inspect group rule →</button>`;
    renderMissingness();
  }
  function renderMissingness() {
    const term = $("#missingSearch").value.trim().toLowerCase(); const sort = $("#missingSort").value; const all = $("#showAllMissing").dataset.all === "true";
    const rows = [...data.integrity.missingness].filter((row) => row.feature.toLowerCase().includes(term)).sort((a, b) => sort === "feature" ? a.feature.localeCompare(b.feature) : b[sort] - a[sort]);
    const view = rows.slice(0, all ? rows.length : 12);
    $("#missingBars").innerHTML = view.map((row) => `<button class="missing-row" data-feature="${row.feature}"><span>${row.feature}</span><div><i style="--w:${row.missing_rate * 100}%"></i><b style="--w:${row.candidate_missing_rate * 100}%"></b></div><strong>${pct(row.missing_rate)}</strong><small>C ${pct(row.candidate_missing_rate)}</small></button>`).join("");
    $("#missingCount").textContent = `${view.length} of ${rows.length} features`;
    $("#showAllMissing").textContent = all ? "Show top 12" : "Show all 98 features";
    $$(".missing-row").forEach((button) => button.addEventListener("click", () => { const row = data.integrity.missingness.find((item) => item.feature === button.dataset.feature); openDrawer("Missingness detail", row.feature, `<div class="drawer-metrics"><span>All rows<strong>${pct(row.missing_rate)}</strong></span><span>Candidate<strong>${pct(row.candidate_missing_rate)}</strong></span><span>Confirmed<strong>${pct(row.confirmed_missing_rate)}</strong></span><span>False Positive<strong>${pct(row.false_positive_missing_rate)}</strong></span></div><p>${row.missing_cells.toLocaleString()} cells are missing. The model pipeline handles missing values inside each training fold; the experiments compare native handling, median imputation, indicators, and dropping fields.</p>`); }));
  }
  function renderLeakage() {
    const rows = data.leakage.comparison;
    $("#leakageCompare").innerHTML = rows.map((row) => `<article><span>${title(row.dataset)}</span><div><i style="--w:${row.macro_f1 * 100}%"></i></div><strong>${fmt(row.macro_f1)}</strong><small>macro F1 / 1.0</small></article>`).join("");
    const categories = ["All", ...new Set(data.leakage.fields.map((field) => field.category))];
    $("#fieldFilter").innerHTML = categories.map((category, index) => `<button class="${index === 0 ? "active" : ""}" data-category="${category}">${category}</button>`).join("");
    function drawFields(category = "All") {
      const fields = data.leakage.fields.filter((field) => category === "All" || field.category === category);
      $("#leakageFields").innerHTML = fields.map((field) => `<button class="leakage-field" data-name="${field.name}"><span class="field-status ${field.present ? "removed" : "reference"}">${field.present ? "REMOVED" : "REFERENCE"}</span><strong>${field.name}</strong><small>${field.category}</small><i>+</i></button>`).join("");
      $$(".leakage-field").forEach((button) => button.addEventListener("click", () => { const field = data.leakage.fields.find((item) => item.name === button.dataset.name); openDrawer(`${field.category} / ${field.present ? "excluded" : "reference only"}`, field.name, `<p><strong>Leakage risk:</strong> ${field.risk}</p><p>${field.why}</p><p>The conservative table keeps measurement-level information where appropriate, but removes decision-stage information that effectively summarizes later NASA vetting.</p>`); }));
    }
    drawFields(); $$("#fieldFilter button").forEach((button) => button.addEventListener("click", () => { $$("#fieldFilter button").forEach((item) => item.classList.toggle("active", item === button)); drawFields(button.dataset.category); }));
  }
  function renderFolds() {
    const folds = data.folds.assignments;
    $("#foldButtons").innerHTML = folds.map((fold, index) => `<button class="${index === 0 ? "active" : ""}" data-fold="${fold.fold}">0${fold.fold}</button>`).join("");
    function selectFold(foldNumber) {
      const fold = folds.find((item) => item.fold === Number(foldNumber));
      $("#foldTitle").textContent = `Fold ${fold.fold}`;
      $("#foldDetail").innerHTML = `<div class="fold-count"><span>Held-out KOIs<strong>${fold.validation_rows.toLocaleString()}</strong></span><span>Held-out stars<strong>${fold.validation_host_stars.toLocaleString()}</strong></span><span>Group overlap<strong>${fold.group_overlap}</strong></span></div><div class="fold-class-bars">${[["Candidate", fold.candidate, "var(--lime)"], ["Confirmed", fold.confirmed, "var(--blue)"], ["False Positive", fold.false_positive, "var(--coral)"]].map(([label, count, color]) => scoreBar(label, count / fold.validation_rows, color, count.toLocaleString())).join("")}</div>`;
      $$("#foldButtons button").forEach((button) => button.classList.toggle("active", Number(button.dataset.fold) === fold.fold));
    }
    selectFold(1); $$("#foldButtons button").forEach((button) => button.addEventListener("click", () => selectFold(button.dataset.fold)));
    $("#validationProof").innerHTML = `<div class="proof-badge">0<br /><span>shared host-star IDs</span></div><h3>Group separation is verified in every fold.</h3><p><code>${data.folds.config.strategy}</code> / ${data.folds.config.n_splits} folds / grouped by <code>${data.folds.config.group_column}</code> / seed ${data.folds.config.random_state}.</p>`;
    const grouped = data.folds.comparison.filter((row) => row.validation.includes("group")); const rowwise = data.folds.comparison.filter((row) => !row.validation.includes("group"));
    $("#splitCompare").innerHTML = [...grouped, ...rowwise].map((row) => `<article class="split-card ${row.validation.includes("group") ? "selected" : ""}"><span>${row.validation.includes("group") ? "GROUP-AWARE" : "ROW-WISE"}</span><strong>${title(row.model)}</strong>${scoreBar("Macro F1", row.macro_f1_mean, row.validation.includes("group") ? "var(--lime)" : "var(--amber)", `± ${fmt(row.macro_f1_std)}`)}${scoreBar("Candidate recall", row.candidate_recall_mean, "var(--coral)", `± ${fmt(row.candidate_recall_std)}`)}</article>`).join("");
  }
  function renderTournament() {
    const board = data.tournament.leaderboard; $("#modelSelect").innerHTML = board.map((row) => `<option value="${row.model}">${title(row.model)}</option>`).join("");
    function drawRows() {
      const metric = $("#tournamentMetric").value; const lower = metric.replace("_mean", ""); const rows = [...board].sort((a, b) => metric === "train_seconds_mean" ? a[metric] - b[metric] : b[metric] - a[metric]); const max = Math.max(...rows.map((row) => row[metric]));
      $("#tournamentRows").innerHTML = rows.map((row, index) => `<button class="tournament-row ${index === 0 ? "best" : ""}" data-model="${row.model}"><span class="rank">${String(index + 1).padStart(2, "0")}</span><strong>${title(row.model)}</strong><div><i style="--w:${(metric === "train_seconds_mean" ? row[metric] / max : row[metric]) * 100}%"></i></div><b>${metric === "train_seconds_mean" ? `${fmt(row[metric], 2)}s` : fmt(row[metric])}</b><small>${metric === "train_seconds_mean" ? "relative train time" : `± ${fmt(row[`${lower}_std`])}`}</small></button>`).join("");
      $$(".tournament-row").forEach((button) => button.addEventListener("click", () => { $("#modelSelect").value = button.dataset.model; inspect(button.dataset.model); }));
    }
    function inspect(model) {
      const row = board.find((item) => item.model === model); const detail = data.tournament.oofDetails[model]; const folds = data.tournament.foldMetrics.filter((item) => item.model === model);
      $("#modelInspector").innerHTML = `<div class="inspector-heading"><span class="card-tag">Model evidence</span><h3>${title(model)}</h3><p>Full OOF class metrics and the five fold outcomes.</p></div><div class="model-detail-grid"><div class="card-surface">${detail.classMetrics.map((item) => `<div class="class-metric"><strong>${title(item.label)}</strong>${scoreBar("Precision", item.precision, classColors[item.label])}${scoreBar("Recall", item.recall, classColors[item.label])}${scoreBar("F1", item.f1, classColors[item.label])}<small>Support ${item.support.toLocaleString()}</small></div>`).join("")}</div><div class="card-surface fold-spark"><span class="card-tag">Fold-level macro F1</span>${folds.map((fold) => `<div><small>Fold ${fold.fold}</small><i style="--h:${fold.macro_f1 * 100}%"></i><strong>${fmt(fold.macro_f1)}</strong></div>`).join("")}</div></div>`;
    }
    $("#tournamentMetric").addEventListener("change", drawRows); $("#modelSelect").addEventListener("change", (event) => inspect(event.target.value)); drawRows(); inspect(board[0].model);
  }
  function renderFormulations() {
    const topBinary = data.formulations.binary[0]; const topHybrid = [...data.formulations.hybrid].sort((a, b) => b.macro_f1 - a.macro_f1)[0]; const topHierarchy = [...data.formulations.hierarchy].sort((a, b) => b.macro_f1 - a.macro_f1)[0]; const topRescue = [...data.formulations.rescue].sort((a, b) => b.macro_f1 - a.macro_f1)[0];
    const items = [
      { id: "direct", label: "Direct three-class", score: data.formulations.directMacroF1, task: "Candidate, Confirmed, False Positive", note: "Native headline task", detail: "All 9,564 rows remain in the task. The final selected ensemble is evaluated with group-aware OOF predictions." },
      { id: "binary", label: "Resolved-only binary", score: topBinary.binary_macro_f1_mean, task: "Confirmed vs False Positive", note: "Candidates removed", detail: "This is a real but easier task: every unresolved Candidate row is excluded from training and the target." },
      { id: "hybrid", label: "Binary threshold hybrid", score: topHybrid.macro_f1, task: "Three labels via threshold", note: "Not the direct task", detail: `The best displayed hybrid uses ${title(topHybrid.model)} at threshold ${topHybrid.threshold}. It cannot match the direct ensemble on the native task.` },
      { id: "hierarchy", label: "Candidate-first hierarchy", score: topHierarchy.macro_f1, task: "Candidate detector → resolved model", note: "Below headline", detail: "A dedicated Candidate front door did not find a clean enough boundary to beat the direct ensemble." },
      { id: "rescue", label: "Binary residual rescue", score: topRescue.macro_f1, task: "Binary confidence + rescue", note: "Exploratory", detail: "The stronger nested version only moved macro F1 by a tiny amount, so it remains exploratory." },
    ];
    $("#formulationCards").innerHTML = items.map((item, index) => `<button class="formulation-card ${index === 0 ? "active" : ""}" data-id="${item.id}"><span>${item.note}</span><strong>${item.label}</strong><em>${fmt(item.score)} macro F1</em><small>${item.task}</small></button>`).join("");
    function select(id) { const item = items.find((entry) => entry.id === id); $("#formulationDetail").innerHTML = `<span class="card-tag">What this score means</span><h3>${item.label}</h3><p>${item.detail}</p>${scoreBar("Reported macro F1", item.score, item.id === "direct" ? "var(--lime)" : "var(--amber)")}`; $$(".formulation-card").forEach((button) => button.classList.toggle("active", button.dataset.id === id)); }
    select("direct"); $$(".formulation-card").forEach((button) => button.addEventListener("click", () => select(button.dataset.id)));
    const conservative = data.featureSets.conservative.find((row) => row.model === "lightgbm_balanced"); const reduced = data.featureSets.reduced.find((row) => row.model === "lightgbm_balanced");
    $("#featureDelta").textContent = fmt(data.featureSets.deltaMacroF1, 3); $("#featureSetCompare").innerHTML = `<div class="feature-compare"><article><span>98 FEATURE CONSERVATIVE</span><strong>${fmt(conservative.macro_f1_mean)}</strong><p>Retains measurement uncertainties and diagnostic features while excluding target proxies.</p></article><div class="compare-arrow">−${fmt(data.featureSets.deltaMacroF1, 3)}</div><article><span>59 FEATURE REDUCED</span><strong>${fmt(reduced.macro_f1_mean)}</strong><p>Smaller, more interpretable scientific measurement set.</p></article></div>`;
  }
  function renderExperiments() {
    const sources = {
      "Tuning": data.experiments.tuningBest.map((row) => ({ ...row, name: `${title(row.family || row.model)} tuned`, macro: row.macro_f1_mean, candidate: row.candidate_recall_mean, outcome: "neutral" })),
      "Missing values": data.experiments.imputation.map((row) => ({ ...row, name: `${title(row.strategy)} / ${title(row.model)}`, macro: row.macro_f1_mean, candidate: row.candidate_recall_mean, outcome: row.strategy === "median_plus_indicator" ? "helped" : "neutral" })),
      "Candidate weighting": data.experiments.weights.map((row) => ({ ...row, name: `${title(row.model)} × ${row.candidate_multiplier}`, macro: row.macro_f1_mean, candidate: row.candidate_recall_mean, outcome: "tradeoff" })),
      "Feature engineering": data.experiments.engineering.map((row) => ({ ...row, name: `${title(row.model)} engineered`, macro: row.macro_f1_mean, candidate: row.macro_recall_mean, outcome: row.model === "lightgbm_balanced" ? "helped" : "neutral" })),
      "Domain features V2": data.experiments.domainV2.map((row) => ({ ...row, name: title(row.experiment), macro: row.macro_f1, candidate: row.candidate_recall, outcome: row.experiment === "lightgbm_plus_detection_consistency" ? "helped-single" : row.experiment === "original_final_ensemble" ? "selected" : "not-selected" })),
      "Pruning": data.experiments.pruning.map((row) => ({ ...row, name: `${title(row.model)} top ${row.top_k}`, macro: row.macro_f1_mean, candidate: row.candidate_recall_mean, outcome: "neutral" })),
    };
    $("#experimentFilters").innerHTML = Object.keys(sources).map((key, index) => `<button class="${index === 0 ? "active" : ""}" data-group="${key}">${key}</button>`).join("");
    function draw(group) { const rows = [...sources[group]].sort((a, b) => b.macro - a.macro); $("#experimentTable").innerHTML = `<div class="technical-table"><div class="table-row table-head"><span>Experiment</span><span>Macro F1</span><span>Candidate recall</span><span>Verdict</span><span></span></div>${rows.map((row) => `<button class="table-row experiment-row" data-name="${row.name}"><span>${row.name}</span><strong>${fmt(row.macro)}</strong><strong>${row.candidate == null ? "n/a" : fmt(row.candidate)}</strong><em class="${row.outcome}">${row.outcome}</em><i>+</i></button>`).join("")}</div>`; $$(".experiment-row").forEach((button) => button.addEventListener("click", () => { const row = rows.find((entry) => entry.name === button.dataset.name); openDrawer(`${group} experiment`, row.name, `<div class="drawer-metrics"><span>Macro F1<strong>${fmt(row.macro)}</strong></span><span>Candidate recall<strong>${row.candidate == null ? "n/a" : fmt(row.candidate)}</strong></span></div><p>This row comes from the saved ${group.toLowerCase()} artifact under the same host-star-aware validation discipline. “Helped” means modest evidence; “tradeoff” means a metric moved at another metric’s expense.</p>`); })); }
    draw("Tuning"); $$("#experimentFilters button").forEach((button) => button.addEventListener("click", () => { $$("#experimentFilters button").forEach((item) => item.classList.toggle("active", item === button)); draw(button.dataset.group); }));
    $("#failedCards").innerHTML = data.experiments.failed.map((item) => `<button class="failed-card" data-name="${item.name}"><span>NOT SELECTED</span><strong>${item.name}</strong><em>${fmt(item.metric)} macro F1</em><p>${item.result}</p><i>Read lesson →</i></button>`).join(""); $$(".failed-card").forEach((button) => button.addEventListener("click", () => { const item = data.experiments.failed.find((entry) => entry.name === button.dataset.name); openDrawer("Useful negative result", item.name, `<p><strong>Hypothesis:</strong> ${item.hypothesis}</p><p><strong>Result:</strong> ${item.result} (${fmt(item.metric)} macro F1)</p><p><strong>Lesson:</strong> ${item.lesson}</p>`); }));
  }
  function renderEnsemble() {
    const final = data.finalEnsemble; $("#ensembleWeights").innerHTML = `<article><span>LightGBM</span><strong>${pct(final.weights.lightgbm)}</strong><i style="--w:${final.weights.lightgbm * 100}%"></i></article><b>+</b><article><span>CatBoost</span><strong>${pct(final.weights.catboost)}</strong><i style="--w:${final.weights.catboost * 100}%"></i></article><b>=</b><article class="blend"><span>Soft vote</span><strong>${fmt(final.metrics.macro_f1)}</strong><small>macro F1</small></article>`;
    const examples = [...final.componentRows].sort((a, b) => Number(a.correct) - Number(b.correct)).slice(0, 12); $("#ensembleSelect").innerHTML = examples.map((row) => `<option value="${row.rowid}">${row.kepoi_name} · ${row.actual} → ${row.predicted}</option>`).join("");
    function selectRow(row) { const labels = [["CANDIDATE", "candidate"], ["CONFIRMED", "confirmed"], ["FALSE POSITIVE", "false_positive"]]; const weights = final.weights; const math = labels.map(([label, key]) => { const lgbm = row[`lightgbm_balanced_${key}`]; const cat = row[`catboost_balanced_${key}`]; const blend = row[`blended_${key}`]; return `<div class="probability-line"><span>${title(label)}</span><div class="member-prob"><small>LGBM ${pct(lgbm)}</small><i style="--w:${lgbm * 100}%;--fill:var(--blue)"></i></div><div class="member-prob"><small>Cat ${pct(cat)}</small><i style="--w:${cat * 100}%;--fill:var(--orange)"></i></div><strong>${pct(blend)}<small>weighted</small></strong></div>`; }).join(""); $("#ensembleMath").innerHTML = `<div class="koid-head"><span>KOI ${row.kepoi_name} / held-out fold ${row.fold}</span><strong class="${row.correct ? "correct" : "wrong"}">${row.actual} → ${row.predicted} ${row.correct ? "✓" : "×"}</strong></div><p class="equation">0.6364 × LightGBM probability + 0.3636 × CatBoost probability = displayed blended probability</p>${math}<div class="inspector-proof">The displayed weighted probabilities reproduce the saved uncalibrated OOF ensemble exactly.</div>`; }
    function find(term) { const clean = term.trim().toLowerCase(); if (!clean) return; const row = final.componentRows.find((item) => String(item.rowid) === clean || item.kepoi_name.toLowerCase().includes(clean)); if (row) { $("#ensembleSelect").value = examples.some((item) => item.rowid === row.rowid) ? row.rowid : ""; selectRow(row); } }
    $("#ensembleSelect").addEventListener("change", (event) => selectRow(final.componentRows.find((row) => row.rowid === Number(event.target.value)))); $("#ensembleSearch").addEventListener("change", (event) => find(event.target.value)); selectRow(examples[0]);
  }
  function renderErrors() {
    const matrix = data.finalEnsemble.confusion.matrix; const classes = data.meta.classOrder; const total = matrix.flat().reduce((sum, value) => sum + value, 0);
    $("#confusionMatrix").innerHTML = `<div class="matrix-label top">Predicted →</div><div class="matrix-grid"><span></span>${classes.map((label) => `<span class="axis">${title(label)}</span>`).join("")}${classes.map((actual, row) => `<span class="axis row-axis">Actual ${title(actual)}</span>${classes.map((predicted, col) => `<button class="matrix-cell ${row === col ? "diagonal" : ""}" data-actual="${actual}" data-predicted="${predicted}" style="--alpha:${matrix[row][col] / Math.max(...matrix.flat())}"><strong>${matrix[row][col].toLocaleString()}</strong><small>${pct(matrix[row][col] / matrix[row].reduce((a, b) => a + b), 1)} of actual</small></button>`).join("")}`).join("")}</div><p class="matrix-note">Rows are actual classes. Columns are predictions. Total held-out decisions: ${total.toLocaleString()}.</p>`;
    function select(actual, predicted) { activeConfusion = { actual, predicted }; const r = classes.indexOf(actual); const c = classes.indexOf(predicted); const count = matrix[r][c]; const rowTotal = matrix[r].reduce((sum, value) => sum + value, 0); const correct = actual === predicted; $("#confusionExplanation").innerHTML = `<span class="card-tag">Selected cell</span><h3>${title(actual)} → ${title(predicted)}</h3><strong>${count.toLocaleString()}</strong><p>${pct(count / rowTotal)} of actual ${title(actual)} rows were predicted ${title(predicted)}. ${correct ? "This is a correct prediction." : "This is a directional error; inspect the exact held-out object set below."}</p><button class="outline-button" id="openCellRows">Open object set ↓</button>`; $$(".matrix-cell").forEach((button) => button.classList.toggle("selected", button.dataset.actual === actual && button.dataset.predicted === predicted)); renderObjectRows(); $("#openCellRows").addEventListener("click", () => $("#objectSetTitle").scrollIntoView({ behavior: "smooth", block: "center" })); }
    $$(".matrix-cell").forEach((button) => button.addEventListener("click", () => select(button.dataset.actual, button.dataset.predicted))); select(activeConfusion.actual, activeConfusion.predicted);
  }
  function renderObjectRows() {
    const rows = data.finalEnsemble.oofRows.filter((row) => row.actual === activeConfusion.actual && row.predicted === activeConfusion.predicted); $("#objectSetTitle").textContent = `${title(activeConfusion.actual)} → ${title(activeConfusion.predicted)} / ${rows.length.toLocaleString()} held-out rows`; $("#objectTable").innerHTML = `<div class="object-table">${rows.slice(0, 12).map((row) => `<button data-row="${row.rowid}"><span>${row.kepoi_name}</span><strong>${pct(row.max_probability)}</strong><small>Candidate probability ${pct(row.candidate_probability)}</small><i>${row.correct ? "correct" : "error"}</i></button>`).join("")}</div>${rows.length > 12 ? `<p class="table-limit">Showing 12 of ${rows.length.toLocaleString()} rows. Use the Candidate Lab for the full searchable error cohort.</p>` : ""}`; $$("#objectTable button").forEach((button) => button.addEventListener("click", () => { const row = data.finalEnsemble.oofRows.find((item) => item.rowid === Number(button.dataset.row)); openDrawer("Saved held-out prediction", row.kepoi_name, `<div class="drawer-metrics"><span>Actual<strong>${title(row.actual)}</strong></span><span>Prediction<strong>${title(row.predicted)}</strong></span><span>Max confidence<strong>${pct(row.max_probability)}</strong></span><span>Candidate probability<strong>${pct(row.candidate_probability)}</strong></span></div><p>This is a real final out-of-fold prediction. The Validation Experience does not re-score the row in the browser.</p>`); }));
  }
  function drawCanvasCurve(canvas, curves, label) {
    const dpr = devicePixelRatio || 1; const rect = canvas.getBoundingClientRect(); canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; const ctx = canvas.getContext("2d"); ctx.scale(dpr, dpr); const width = rect.width; const height = rect.height; ctx.fillStyle = "#fffaf0"; ctx.fillRect(0, 0, width, height); ctx.strokeStyle = "rgba(17,17,17,.16)"; ctx.lineWidth = 1; for (let n = 0; n <= 4; n++) { const p = 28 + (width - 50) * n / 4; ctx.beginPath(); ctx.moveTo(p, 16); ctx.lineTo(p, height - 30); ctx.stroke(); ctx.beginPath(); ctx.moveTo(28, 16 + (height - 46) * n / 4); ctx.lineTo(width - 22, 16 + (height - 46) * n / 4); ctx.stroke(); }
    const colors = ["#4f7c4a", "#a9c095", "#e78245", "#172019", "#cf6736"]; curves.forEach((curve, index) => { ctx.strokeStyle = colors[index]; ctx.lineWidth = curve.label.includes("macro") ? 3 : 2; ctx.beginPath(); curve.points.forEach((point, pointIndex) => { const x = 28 + point.x * (width - 50); const y = height - 30 - point.y * (height - 46); if (pointIndex) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke(); }); ctx.fillStyle = "#172019"; ctx.font = "700 11px Inter, sans-serif"; ctx.fillText(label, 30, 13); ctx.fillText("0", 23, height - 14); ctx.fillText("1", width - 27, height - 14); }
  function renderCalibration() {
    const metrics = data.calibration.metrics; $("#calibrationMetrics").innerHTML = metrics.map((row) => `<article><span>${title(row.name)}</span><strong>${fmt(row.ece)}</strong><small>ECE / log loss ${fmt(row.log_loss)}</small><i style="--w:${Math.max(0, 1 - row.ece) * 100}%"></i></article>`).join("");
    function draw(mode) {
      $$(".curve-toggle button").forEach((button) => button.classList.toggle("active", button.dataset.curve === mode)); const temp = data.calibration.curves.temperature; const uncal = data.calibration.curves.uncalibrated;
      if (mode === "reliability") { const methods = ["uncalibrated", "temperature"]; $("#curveStage").innerHTML = `<div class="reliability-chart">${methods.map((method) => `<article><strong>${title(method)}</strong><div class="reliability-bars">${data.calibration.reliability.filter((row) => row.method === method).map((row) => `<span title="${row.rows} rows"><i style="--h:${row.mean_confidence * 100}%"></i><b style="--h:${row.accuracy * 100}%"></b></span>`).join("")}</div><small>light = predicted confidence / dark = actual accuracy</small></article>`).join("")}</div>`; }
      else { const source = mode === "roc" ? "roc" : "precisionRecall"; const classKey = mode === "roc" ? "auc" : "average_precision"; const curves = uncal[source].classes.map((item) => ({ ...item, label: `${title(item.label)} / uncal ${fmt(item[classKey], 3)}` })); if (mode === "roc") curves.push({ ...uncal[source].macro, label: `macro / uncal ${fmt(uncal[source].macro.auc, 3)}` }); $("#curveStage").innerHTML = `<div class="canvas-wrap"><canvas id="curveCanvas" aria-label="${mode} curve"></canvas><div class="curve-legend">${curves.map((curve) => `<span>${curve.label}</span>`).join("")}</div><p>Uncalibrated OOF probabilities shown. Temperature scaling preserves their class ranking, so discrimination curves remain essentially unchanged.</p></div>`; requestAnimationFrame(() => drawCanvasCurve($("#curveCanvas"), curves, mode === "roc" ? "True-positive rate" : "Precision")); }
    }
    draw("reliability"); $$(".curve-toggle button").forEach((button) => button.addEventListener("click", () => draw(button.dataset.curve)));
  }
  function renderInterpretability() {
    const lookup = { permutation: data.interpretability.permutation.map((row) => ({ ...row, value: row.permutation_importance_mean, note: row.plain_language })), gain: data.interpretability.gain.map((row) => ({ ...row, value: row.gain_importance_mean, note: row.plain_language })), shap: data.interpretability.shap.map((row) => ({ ...row, value: row.mean_abs_shap, note: row.plain_language })) };
    function draw() { const method = $("#importanceMethod").value; const term = $("#importanceSearch").value.toLowerCase(); const rows = lookup[method].filter((row) => `${row.feature} ${row.note}`.toLowerCase().includes(term)).sort((a, b) => b.value - a.value).slice(0, 20); const max = rows[0]?.value || 1; $("#importanceRows").innerHTML = rows.map((row, index) => `<button class="importance-row" data-feature="${row.feature}"><span>${String(index + 1).padStart(2, "0")}</span><strong>${row.feature}</strong><div><i style="--w:${row.value / max * 100}%"></i></div><b>${fmt(row.value, 4)}</b><small>${row.note}</small></button>`).join(""); $$(".importance-row").forEach((button) => button.addEventListener("click", () => { const row = lookup[method].find((item) => item.feature === button.dataset.feature); openDrawer(`${title(method)} importance`, row.feature, `<p>${row.note}</p><p><strong>Measured importance:</strong> ${fmt(row.value, 5)}.</p><p>Importance describes what this fitted model depended on; it does not prove that the feature physically causes a KOI disposition.</p>`); })); }
    $("#importanceMethod").addEventListener("change", draw); $("#importanceSearch").addEventListener("input", draw); draw();
  }
  function renderClaims() {
    function draw() { const status = $("#claimStatus").value; const term = $("#claimSearch").value.toLowerCase(); const rows = data.claims.filter((row) => (status === "all" || row.status === status) && JSON.stringify(row).toLowerCase().includes(term)); $("#claimRows").innerHTML = rows.map((row) => `<button class="claim-row" data-claim="${row.claim}"><span class="claim-status ${row.status}">${row.status}</span><strong>${row.claim}</strong><small>${row.artifact}</small><i>Inspect →</i></button>`).join(""); $$(".claim-row").forEach((button) => button.addEventListener("click", () => { const row = data.claims.find((item) => item.claim === button.dataset.claim); openDrawer(`${row.status} claim`, row.claim, `<p><strong>Artifact:</strong> <code>${row.artifact}</code></p><p><strong>Generator / experiment script:</strong> <code>${row.script}</code></p><p><strong>Caveat:</strong> ${row.caveat}</p>`); })); }
    $("#claimStatus").addEventListener("change", draw); $("#claimSearch").addEventListener("input", draw); draw();
  }
  function renderPipeline() {
    $("#pipelineMap").innerHTML = data.reproducibility.map((node, index) => `<button class="pipeline-node ${node.kind}" data-name="${node.name}"><span>${String(index + 1).padStart(2, "0")}</span><strong>${node.name}</strong><small>${node.kind}</small></button>${index < data.reproducibility.length - 1 ? "<i class=\"pipeline-arrow\">→</i>" : ""}`).join("");
    function select(name) { const item = data.reproducibility.find((node) => node.name === name); $("#pipelineDetail").innerHTML = `<span class="card-tag">${item.kind}</span><h3>${item.name}</h3><p><strong>Artifact:</strong> <code>${item.path}</code></p><p><strong>Responsible script:</strong> <code>${item.script}</code></p><p>Each stage writes an inspectable result rather than relying on a manually copied frontend number.</p>`; $$(".pipeline-node").forEach((button) => button.classList.toggle("active", button.dataset.name === name)); }
    $$(".pipeline-node").forEach((button) => button.addEventListener("click", () => select(button.dataset.name))); select(data.reproducibility[0].name);
  }
  function initEvents() {
    document.addEventListener("click", (event) => { const conceptButton = event.target.closest("[data-open-concept]"); if (conceptButton) concept(conceptButton.dataset.openConcept); if (event.target.matches(".close-drawer") || event.target === $("#detailDrawer")) closeDrawer(); }); document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDrawer(); });
  }
  initLinks(); initGuide(); drawSky(); initEvents(); renderHeadline(); renderIntegrity(); renderLeakage(); renderFolds(); renderTournament(); renderFormulations(); renderExperiments(); renderEnsemble(); renderErrors(); renderCalibration(); renderInterpretability(); renderClaims(); renderPipeline();
  $("#missingSearch").addEventListener("input", renderMissingness); $("#missingSort").addEventListener("change", renderMissingness); $("#showAllMissing").addEventListener("click", (event) => { event.currentTarget.dataset.all = event.currentTarget.dataset.all === "true" ? "false" : "true"; renderMissingness(); });
})();
