"""Command-line inference against the saved artefact.

    python ml/predict.py --rainfall 42 --humidity 92 --temperature 27 \
        --drainage 35 --previous-flood 1 --elevation 6 --density 12000 \
        --soil 88

Prints the probability, the predicted class and the honesty label. Missing
features are refused rather than filled with a default, matching the runtime
rule that the system never fabricates a value it does not have.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any, Dict, List

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
if BACKEND not in sys.path:
    sys.path.insert(0, BACKEND)

from ml import dataset as dataset_mod  # noqa: E402
from ml.evaluate_model import load_metadata, load_model, scores  # noqa: E402

ARGUMENTS = (
    ("rainfall", "rainfall_mm_h"),
    ("humidity", "humidity_pct"),
    ("temperature", "temperature_c"),
    ("drainage", "drainage_score"),
    ("previous_flood", "previous_flood"),
    ("elevation", "elevation_m"),
    ("density", "population_density"),
    ("soil", "soil_saturation"),
)


def predict(features: Dict[str, float]) -> Dict[str, Any]:
    missing = [name for name in dataset_mod.FEATURE_ORDER if features.get(name) is None]
    if missing:
        return {
            "available": False,
            "probability": None,
            "predicted_class": None,
            "cannot_assess_reason": "Cannot assess - missing features: "
            + ", ".join(missing) + ".",
        }
    metadata = load_metadata()
    model = load_model(metadata)
    row: List[float] = [float(features[name]) for name in dataset_mod.FEATURE_ORDER]
    probability = scores(model, [row])[0]
    return {
        "available": True,
        "probability": round(probability, 6),
        "predicted_class": "flood_likely" if probability >= 0.5 else "flood_unlikely",
        "model_version": metadata.get("model_version"),
        "implementation": metadata.get("implementation"),
        "label": metadata.get("ui_label"),
        "role": "evidence_only",
        "affects_risk_score": False,
        "limitations": metadata.get("limitations"),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Prototype flood classifier.")
    for flag, _feature in ARGUMENTS:
        parser.add_argument("--" + flag.replace("_", "-"), type=float, default=None)
    args = vars(parser.parse_args())
    features = {feature: args.get(flag) for flag, feature in ARGUMENTS}
    print(json.dumps(predict(features), indent=2))


if __name__ == "__main__":
    main()
