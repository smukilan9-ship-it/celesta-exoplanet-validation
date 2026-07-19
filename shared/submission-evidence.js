window.SUBMISSION_EVIDENCE = {
  "meta": {
    "title": "KOI submission evidence registry",
    "generatedBy": "scripts/generate_submission_evidence_registry.py",
    "officialDatasetOnly": true,
    "externalObservationalDataUsed": false,
    "classOrder": [
      "CANDIDATE",
      "CONFIRMED",
      "FALSE POSITIVE"
    ]
  },
  "coreQuestion": {
    "question": "Can a model predict KOI disposition from permitted measurements without reading NASA's later vetting decisions?",
    "goal": "Estimate performance on unseen KOIs using evidence that would be legitimate at prediction time.",
    "circularity": "If a feature summarizes the same later vetting process that produced the target label, the model is partly reconstructing the answer from itself. That circularity can raise F1 while weakening the scientific claim."
  },
  "headline": {
    "selectedModel": "LightGBM + CatBoost weighted soft-voting ensemble",
    "macroF1": 0.83632626,
    "weightedF1": 0.86244815,
    "accuracy": 0.86177332,
    "candidatePrecision": 0.68248532,
    "candidateRecall": 0.70525784,
    "candidateF1": 0.69368473,
    "weights": {
      "LightGBM": 0.6363636363636362,
      "CatBoost": 0.36363636363636365
    },
    "rows": 9564,
    "classes": 3,
    "features": 98,
    "selectionReason": "It produced the strongest leakage-conservative native three-class result while preserving Candidate recall and a simple, auditable inference path."
  },
  "scoreComparisons": [
    {
      "id": "leaky-three-class",
      "label": "Vetting-aware leakage audit",
      "macroF1": 0.93560112,
      "rows": 9564,
      "classes": 3,
      "candidateRowsIncluded": 1978,
      "status": "audit-only",
      "question": "How well can later NASA vetting fields reconstruct NASA's catalog decision?",
      "whyNotSelected": "The false-positive flags and prior disposition summarize later decision evidence, creating a circular and deployment-weak comparison."
    },
    {
      "id": "resolved-binary",
      "label": "Resolved-only binary benchmark",
      "macroF1": 0.97746341,
      "rows": 7586,
      "classes": 2,
      "candidateRowsIncluded": 0,
      "status": "different-task",
      "question": "Can resolved Confirmed and False Positive objects be separated after every Candidate is removed?",
      "whyNotSelected": "It excludes all 1,978 unresolved Candidates, so it cannot answer the required native three-label question."
    },
    {
      "id": "native-three-class",
      "label": "Selected native three-class model",
      "macroF1": 0.83632626,
      "rows": 9564,
      "classes": 3,
      "candidateRowsIncluded": 1978,
      "status": "headline",
      "question": "Can all three catalog dispositions be predicted from leakage-conservative evidence?",
      "whySelected": "It keeps every row, retains the unresolved class, and uses only permitted evidence available to the model."
    }
  ],
  "twoStageComparison": [
    {
      "approach": "Direct three-class ensemble",
      "macroF1": 0.83632626,
      "status": "selected",
      "lesson": "The simplest strong model remained the best defensible headline."
    },
    {
      "approach": "Binary confidence thresholding",
      "macroF1": 0.7511941,
      "status": "rejected",
      "lesson": "A high binary score did not translate into reliable Candidate recognition."
    },
    {
      "approach": "Candidate-first hierarchy",
      "macroF1": 0.82473031,
      "status": "rejected",
      "lesson": "Candidate was not separable as one clean first-stage group."
    },
    {
      "approach": "Standalone binary residual rescue",
      "macroF1": 0.8303432,
      "status": "rejected",
      "lesson": "The rescue branch added complexity but remained below the direct ensemble."
    },
    {
      "approach": "Nested rescue rule",
      "macroF1": 0.83646755,
      "status": "exploratory-tie",
      "lesson": "The nested gain was about 0.00014, too small to justify replacing the simpler model."
    }
  ],
  "validation": {
    "method": "5-fold StratifiedGroupKFold",
    "group": "kepid",
    "why": "KOIs sharing one host star stay together, preventing related systems from appearing in both training and validation.",
    "rowWiseLightgbmMacroF1": 0.83741866,
    "groupedLightgbmMacroF1": 0.83344599,
    "leaveOneOut": {
      "plain": "Leave-one-out (LOO) trains once for every held-out observation. A grouped version would need to leave out whole host-star systems, not isolated KOI rows.",
      "used": false,
      "reason": "Five grouped folds were chosen because they preserve host separation, class balance, and a common evaluation harness at far lower computational cost. The reported result is not a LOO estimate."
    }
  },
  "featureEngineering": {
    "firstPass": {
      "created": 25,
      "baseLightgbmMacroF1": 0.83344599,
      "engineeredLightgbmMacroF1": 0.83582006,
      "delta": 0.00237406,
      "examples": [
        "transit duty cycle = duration / orbital period",
        "signal-to-noise per square root of observed transits",
        "planet-to-star radius-ratio estimate",
        "relative uncertainty ratios",
        "log transforms for long-tailed physical measurements"
      ]
    },
    "domainV2": {
      "created": 46,
      "bestFamily": "lightgbm_plus_detection_consistency",
      "bestStandaloneMacroF1": 0.83510657,
      "fixedEnsembleMacroF1": 0.83402155,
      "headlineMacroF1": 0.83632626,
      "families": [
        {
          "family": "transit_geometry",
          "featureCount": 8,
          "examples": [
            {
              "name": "fe2_depth_from_ror_ppm",
              "formula": "1e6 × koi_ror²",
              "rationale": "Expected transit depth from the fitted planet/star radius ratio."
            },
            {
              "name": "fe2_log_depth_ror_residual",
              "formula": "log1p(depth) − log1p(1e6 × ror²)",
              "rationale": "Flags disagreement between the reported depth and fitted radius ratio."
            },
            {
              "name": "fe2_radius_ratio_from_prad_srad",
              "formula": "0.0091577 × planet radius / stellar radius",
              "rationale": "Reconstructs a radius ratio from independent planet and stellar radius estimates."
            }
          ]
        },
        {
          "family": "detection_consistency",
          "featureCount": 9,
          "examples": [
            {
              "name": "fe2_mes_to_ses_ratio",
              "formula": "multiple-event statistic / single-event statistic",
              "rationale": "Tests whether repeated events strengthen the detection beyond its strongest single event."
            },
            {
              "name": "fe2_mes_accumulation_ratio",
              "formula": "MES / (SES × sqrt(number of transits))",
              "rationale": "Compares observed signal accumulation with a simple repeated-event expectation."
            },
            {
              "name": "fe2_snr_to_mes_ratio",
              "formula": "model SNR / multiple-event statistic",
              "rationale": "Contrasts two independent summaries of detection strength."
            }
          ]
        },
        {
          "family": "centroid_agreement",
          "featureCount": 9,
          "examples": [
            {
              "name": "fe2_dicco_significance",
              "formula": "|centroid offset| / |offset uncertainty|",
              "rationale": "Normalizes the out-of-transit centroid offset by its uncertainty."
            },
            {
              "name": "fe2_dikco_significance",
              "formula": "|difference-image offset| / |offset uncertainty|",
              "rationale": "Normalizes the difference-image centroid offset by its uncertainty."
            },
            {
              "name": "fe2_centroid_offset_mean",
              "formula": "mean absolute offset",
              "rationale": "Summarizes typical offset across two centroid diagnostics."
            }
          ]
        },
        {
          "family": "stellar_physics",
          "featureCount": 9,
          "examples": [
            {
              "name": "fe2_stellar_density_proxy",
              "formula": "stellar mass / stellar radius³",
              "rationale": "Reconstructs relative stellar density from mass and radius."
            },
            {
              "name": "fe2_log_density_residual",
              "formula": "log(fitted density) − log(mass/radius³)",
              "rationale": "Measures consistency between fitted and mass-radius stellar density."
            },
            {
              "name": "fe2_surface_gravity_proxy",
              "formula": "solar logg + log10(mass/radius²)",
              "rationale": "Reconstructs stellar surface gravity from mass and radius."
            }
          ]
        },
        {
          "family": "data_quality_multiplicity",
          "featureCount": 11,
          "examples": [
            {
              "name": "fe2_missing_total",
              "formula": "count missing among 98 conservative inputs",
              "rationale": "Makes overall data completeness explicit to both tree families."
            },
            {
              "name": "fe2_missing_transit",
              "formula": "count missing transit measurements",
              "rationale": "Separates missing transit-fit evidence from other missingness."
            },
            {
              "name": "fe2_missing_stellar",
              "formula": "count missing stellar measurements",
              "rationale": "Separates host-star evidence gaps."
            }
          ]
        }
      ]
    },
    "conclusion": "Creative row-local physics features produced small model-specific gains, but the complete fixed ensemble did not improve. The result suggests that the remaining Candidate errors are driven more by unresolved or missing evidence than by an obvious algebraic combination of the existing columns.",
    "caveat": "This is evidence of a practical plateau under tested features, not proof of a mathematical ceiling."
  },
  "eda": {
    "rows": 9564,
    "originalColumns": 140,
    "classCounts": {
      "FALSE POSITIVE": 4839,
      "CONFIRMED": 2747,
      "CANDIDATE": 1978
    },
    "uniqueHosts": 8214,
    "hostsWithMultipleKois": 938,
    "maximumKoisPerHost": 7,
    "exactDuplicateRows": 0,
    "allMissingColumns": [
      "koi_eccen_err1",
      "koi_eccen_err2",
      "koi_incl_err1",
      "koi_incl_err2",
      "koi_ingress",
      "koi_ingress_err1",
      "koi_ingress_err2",
      "koi_longp",
      "koi_longp_err1",
      "koi_longp_err2",
      "koi_model_chisq",
      "koi_model_dof",
      "koi_sage",
      "koi_sage_err1",
      "koi_sage_err2",
      "koi_sma_err1",
      "koi_sma_err2",
      "koi_teq_err1",
      "koi_teq_err2"
    ],
    "allMissingCount": 19,
    "columnsWithAnyMissing": 119,
    "conservativeFeatureCount": 98
  },
  "confusion": {
    "class_names": [
      "CANDIDATE",
      "CONFIRMED",
      "FALSE POSITIVE"
    ],
    "matrix": [
      [
        1395,
        243,
        340
      ],
      [
        160,
        2554,
        33
      ],
      [
        489,
        57,
        4293
      ]
    ]
  },
  "importance": [
    {
      "feature": "koi_max_mult_ev",
      "importance": 0.10848074,
      "meaning": "strength of the combined transit-event detection signal"
    },
    {
      "feature": "koi_dikco_msky",
      "importance": 0.02356417,
      "meaning": "difference-image centroid offset diagnostic"
    },
    {
      "feature": "koi_dicco_msky",
      "importance": 0.01269143,
      "meaning": "sky-plane centroid offset diagnostic"
    },
    {
      "feature": "koi_count",
      "importance": 0.01043818,
      "meaning": "number of KOIs associated with the same target system"
    },
    {
      "feature": "koi_prad",
      "importance": 0.00807476,
      "meaning": "estimated planet radius"
    },
    {
      "feature": "koi_dor",
      "importance": 0.00454657,
      "meaning": "scaled orbital distance relative to stellar radius"
    },
    {
      "feature": "koi_model_snr",
      "importance": 0.00452483,
      "meaning": "model signal-to-noise ratio for the transit fit"
    },
    {
      "feature": "koi_num_transits",
      "importance": 0.00448047,
      "meaning": "number of observed transit-like events"
    },
    {
      "feature": "koi_fwm_sdec",
      "importance": 0.00437864,
      "meaning": "flux-weighted centroid diagnostic in declination"
    },
    {
      "feature": "koi_impact",
      "importance": 0.00321713,
      "meaning": "transit impact parameter, related to the transit path across the star"
    },
    {
      "feature": "koi_max_sngle_ev",
      "importance": 0.00309743,
      "meaning": "strength of the strongest single transit-event signal"
    },
    {
      "feature": "koi_duration",
      "importance": 0.00247205,
      "meaning": "length of each transit event"
    }
  ],
  "downloads": [
    {
      "id": "paper",
      "label": "Full research paper",
      "href": "downloads/final_research_paper_draft.md"
    },
    {
      "id": "summary",
      "label": "500–1000 word judge summary",
      "href": "downloads/judge_summary.md"
    },
    {
      "id": "final-report",
      "label": "Final UX and submission report",
      "href": "downloads/final_ux_and_submission_report.md"
    },
    {
      "id": "final-colab",
      "label": "Final ensemble reproduction Colab",
      "href": "downloads/final_model_reproduction.ipynb"
    },
    {
      "id": "tournament-colab",
      "label": "All-model tournament Colab",
      "href": "downloads/model_tournament.ipynb"
    },
    {
      "id": "workbook",
      "label": "Final training and evidence workbook",
      "href": "downloads/KOI_Final_Training_Evidence.xlsx"
    }
  ],
  "sources": [
    "data/raw/competition/official_drive/KOI_Cumulative_clean.csv",
    "data/processed/modeling_manifest.json",
    "experiments/results/soft_voting_ensemble/ensemble_leaderboard.csv",
    "experiments/results/leakage_audit_comparison/summary.csv",
    "experiments/results/problem_formulation_comparison/binary_leaderboard.csv",
    "experiments/results/nested_binary_rescue_validation/summary.csv",
    "experiments/results/domain_feature_challenger_v2/leaderboard.csv"
  ]
};
