# Celesta Exoplanet — Validation Experience

The technical evidence room for the India High School Exoplanet Data Challenge submission.

Six checkpoints answer the questions a judge should ask: Was the table prepared correctly? Was leakage removed? Were host stars held apart? Did every model use the same test? Why this ensemble? Can each claim be traced?

## Run locally

```bash
npm ci
npm run check
python3 -m http.server 8002
```

Open <http://127.0.0.1:8002/>.

`npm run check` rebuilds the React interactions and verifies the saved evidence: row counts, class counts, ensemble weights, probability sums, and the exact LightGBM + CatBoost blend.

## Evidence boundary

This app renders saved out-of-fold evidence. It does not train a browser model or calculate a replacement score. The complete reproduction lives in the [final model repository](https://github.com/smukilan9-ship-it/celesta-exoplanet-reproducible-model).

## Continue the submission

- [Flagship app](https://github.com/smukilan9-ship-it/celesta-exoplanet-flagship)
- [Learner Experience](https://github.com/smukilan9-ship-it/celesta-exoplanet-learner)
- [Candidate Error Lab](https://github.com/smukilan9-ship-it/celesta-exoplanet-candidate-lab)
