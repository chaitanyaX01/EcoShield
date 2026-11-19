"""Re-evaluate the saved artefact on the held-out split.

    python ml/evaluate_model.py

Loads ml/artifacts/model_metadata.json, loads the persisted model, regenerates
the same deterministic dataset and split, and recomputes the metrics. This is
how the numbers in the metadata file can be independently checked - nothing is
taken on trust from the training run.
"""
from __future__ import annotations

import json
import os
import sys
from typing import Any, Dict, List

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
if BACKEND not in sys.path:
    sys.path.insert(0, BACKEND)

from ml import dataset as dataset_mod  # noqa: E402
from ml import metrics as metrics_mod  # noqa: E402

ARTIFACT_DIR = os.path.join(HERE, "artifacts")


def load_metadata() -> Dict[str, Any]:
    path = os.path.join(ARTIFACT_DIR, "model_metadata.json")
    if not os.path.exists(path):
        raise SystemExit("No artefact found. Run 'python ml/train_model.py' first.")
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def load_model(metadata: Dict[str, Any]) -> Any:
    path = os.path.join(ARTIFACT_DIR, str(metadata["artifact_file"]))
    if path.endswith(".joblib"):
        import joblib  # type: ignore

        return joblib.load(path)
    import pickle

    with open(path, "rb") as handle:
        return pickle.load(handle)


def scores(model: Any, rows: List[List[float]]) -> List[float]:
    proba = model.predict_proba(rows)
    return [float(row[1]) if len(row) > 1 else float(row[0]) for row in proba]


def evaluate() -> Dict[str, Any]:
    metadata = load_metadata()
    model = load_model(metadata)
    spec = metadata.get("dataset") or {}
    data = dataset_mod.build_dataset(
        samples=int(spec.get("samples") or dataset_mod.DEFAULT_SAMPLES),
        seed=int(spec.get("seed") or dataset_mod.DEFAULT_SEED),
    )
    split = dataset_mod.train_test_split(
        data["features"], data["labels"],
        test_fraction=float(spec.get("test_fraction") or 0.25),
        seed=int(spec.get("seed") or dataset_mod.DEFAULT_SEED),
    )
    recomputed = metrics_mod.evaluate(split["y_test"], scores(model, split["x_test"]))
    recorded = metadata.get("metrics") or {}
    matches = all(
        abs(float(recomputed[name]) - float(recorded.get(name, -1))) < 1e-6
        for name in ("accuracy", "precision", "recall", "f1", "roc_auc")
    )
    return {
        "model_version": metadata.get("model_version"),
        "implementation": metadata.get("implementation"),
        "recorded": recorded,
        "recomputed": recomputed,
        "matches_recorded_metrics": matches,
        "limitations": metadata.get("limitations"),
    }


if __name__ == "__main__":
    report = evaluate()
    print(json.dumps(report, indent=2))
