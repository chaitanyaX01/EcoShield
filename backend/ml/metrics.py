"""Classification metrics computed from scratch.

Used so the reported numbers are always the REAL metrics of the model that was
just trained, on the held-out split, regardless of whether scikit-learn is
available in the environment.
"""
from __future__ import annotations

from typing import Dict, List, Sequence


def confusion(y_true: Sequence[int], y_pred: Sequence[int]) -> Dict[str, int]:
    tp = fp = tn = fn = 0
    for actual, predicted in zip(y_true, y_pred):
        if int(predicted) == 1 and int(actual) == 1:
            tp += 1
        elif int(predicted) == 1 and int(actual) == 0:
            fp += 1
        elif int(predicted) == 0 and int(actual) == 0:
            tn += 1
        else:
            fn += 1
    return {"true_positive": tp, "false_positive": fp,
            "true_negative": tn, "false_negative": fn}


def roc_auc(y_true: Sequence[int], scores: Sequence[float]) -> float:
    """AUC via the rank (Mann-Whitney U) formulation, with tie handling."""
    pairs = sorted(zip(scores, y_true), key=lambda item: float(item[0]))
    ranks: List[float] = [0.0] * len(pairs)
    index = 0
    while index < len(pairs):
        end = index
        while end + 1 < len(pairs) and float(pairs[end + 1][0]) == float(pairs[index][0]):
            end += 1
        average_rank = (index + end) / 2.0 + 1.0
        for position in range(index, end + 1):
            ranks[position] = average_rank
        index = end + 1
    positives = sum(1 for _, label in pairs if int(label) == 1)
    negatives = len(pairs) - positives
    if positives == 0 or negatives == 0:
        return float("nan")
    rank_sum = sum(rank for rank, (_, label) in zip(ranks, pairs) if int(label) == 1)
    return (rank_sum - positives * (positives + 1) / 2.0) / (positives * negatives)


def brier_score(y_true: Sequence[int], scores: Sequence[float]) -> float:
    if not y_true:
        return float("nan")
    total = sum((float(score) - int(actual)) ** 2
                for score, actual in zip(scores, y_true))
    return total / len(y_true)


def evaluate(y_true: Sequence[int], scores: Sequence[float],
             threshold: float = 0.5) -> Dict[str, object]:
    predictions = [1 if float(score) >= threshold else 0 for score in scores]
    matrix = confusion(y_true, predictions)
    tp = matrix["true_positive"]
    fp = matrix["false_positive"]
    tn = matrix["true_negative"]
    fn = matrix["false_negative"]
    total = tp + fp + tn + fn
    accuracy = (tp + tn) / total if total else float("nan")
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
    return {
        "threshold": float(threshold),
        "samples": total,
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "roc_auc": round(roc_auc(y_true, scores), 4),
        "brier_score": round(brier_score(y_true, scores), 4),
        "confusion_matrix": matrix,
    }
