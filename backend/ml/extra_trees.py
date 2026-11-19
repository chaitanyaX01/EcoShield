"""Vendored Extra Trees classifier.

scikit-learn's ExtraTreesClassifier is the intended implementation and is used
whenever it can be imported (see train_model.py). This module is a faithful
standard-library fallback of the same algorithm - an ensemble of extremely
randomized decision trees - so the prototype still trains and evaluates a real
model on machines where no third-party packages can be installed.

The algorithm, per tree:
  * at each node, draw `max_features` candidate features at random
  * for each candidate, draw ONE split threshold uniformly between the node's
    observed min and max for that feature (this is what makes it "extra"
    randomized rather than a classic greedy CART split)
  * keep the candidate with the best Gini gain
  * stop at max_depth, at min_samples_split, or when the node is pure

Predicted probability is the mean of the per-tree leaf class frequencies, which
matches the scikit-learn convention for `predict_proba`.
"""
from __future__ import annotations

import random
from typing import Dict, List, Optional, Sequence, Tuple


class Node:
    __slots__ = ("feature", "threshold", "left", "right", "probability", "samples")

    def __init__(self, probability: Optional[float] = None, samples: int = 0) -> None:
        self.feature: Optional[int] = None
        self.threshold: Optional[float] = None
        self.left: Optional["Node"] = None
        self.right: Optional["Node"] = None
        self.probability = probability
        self.samples = samples

    @property
    def is_leaf(self) -> bool:
        return self.feature is None


def _gini(positives: int, total: int) -> float:
    if total <= 0:
        return 0.0
    p = positives / total
    return 1.0 - (p * p) - ((1.0 - p) * (1.0 - p))


class ExtraTreeClassifier:
    """A single extremely randomized tree for binary labels (0/1)."""

    def __init__(self, max_depth: int = 12, min_samples_split: int = 8,
                 max_features: int = 3, seed: int = 0) -> None:
        self.max_depth = int(max_depth)
        self.min_samples_split = int(min_samples_split)
        self.max_features = int(max_features)
        self.seed = int(seed)
        self.root: Optional[Node] = None
        self.n_features = 0
        self.importances: List[float] = []

    # -- fitting ---------------------------------------------------------
    def fit(self, x: Sequence[Sequence[float]], y: Sequence[int]) -> "ExtraTreeClassifier":
        rng = random.Random(self.seed)
        self.n_features = len(x[0]) if x else 0
        self.importances = [0.0] * self.n_features
        indices = list(range(len(y)))
        self.root = self._grow(x, y, indices, 0, rng)
        total = sum(self.importances)
        if total > 0:
            self.importances = [value / total for value in self.importances]
        return self

    def _grow(self, x: Sequence[Sequence[float]], y: Sequence[int],
              indices: List[int], depth: int, rng: random.Random) -> Node:
        positives = sum(y[i] for i in indices)
        total = len(indices)
        node = Node(probability=positives / total if total else 0.0, samples=total)
        if (depth >= self.max_depth or total < self.min_samples_split
                or positives == 0 or positives == total):
            return node

        parent_gini = _gini(positives, total)
        candidates = list(range(self.n_features))
        rng.shuffle(candidates)
        candidates = candidates[: max(1, min(self.max_features, self.n_features))]

        best: Optional[Tuple[float, int, float, List[int], List[int]]] = None
        for feature in candidates:
            values = [x[i][feature] for i in indices]
            low, high = min(values), max(values)
            if high <= low:
                continue
            threshold = rng.uniform(low, high)
            left: List[int] = []
            right: List[int] = []
            for i in indices:
                if x[i][feature] <= threshold:
                    left.append(i)
                else:
                    right.append(i)
            if not left or not right:
                continue
            left_pos = sum(y[i] for i in left)
            right_pos = sum(y[i] for i in right)
            weighted = (
                len(left) / total * _gini(left_pos, len(left))
                + len(right) / total * _gini(right_pos, len(right))
            )
            gain = parent_gini - weighted
            if best is None or gain > best[0]:
                best = (gain, feature, threshold, left, right)

        if best is None or best[0] <= 0.0:
            return node

        gain, feature, threshold, left, right = best
        self.importances[feature] += gain * total
        node.feature = feature
        node.threshold = threshold
        node.left = self._grow(x, y, left, depth + 1, rng)
        node.right = self._grow(x, y, right, depth + 1, rng)
        return node

    # -- inference -------------------------------------------------------
    def probability(self, row: Sequence[float]) -> float:
        node = self.root
        if node is None:
            raise RuntimeError("Tree is not fitted.")
        while not node.is_leaf:
            assert node.feature is not None and node.threshold is not None
            node = node.left if row[node.feature] <= node.threshold else node.right  # type: ignore[assignment]
            if node is None:
                raise RuntimeError("Malformed tree.")
        return float(node.probability or 0.0)


class ExtraTreesClassifier:
    """Ensemble of ExtraTreeClassifier with a scikit-learn-shaped interface."""

    implementation = "vendored-extra-trees"

    def __init__(self, n_estimators: int = 80, max_depth: int = 12,
                 min_samples_split: int = 8, max_features: int = 3,
                 random_state: int = 20260910) -> None:
        self.n_estimators = int(n_estimators)
        self.max_depth = int(max_depth)
        self.min_samples_split = int(min_samples_split)
        self.max_features = int(max_features)
        self.random_state = int(random_state)
        self.trees: List[ExtraTreeClassifier] = []
        self.classes_ = [0, 1]
        self.feature_importances_: List[float] = []

    def fit(self, x: Sequence[Sequence[float]],
            y: Sequence[int]) -> "ExtraTreesClassifier":
        rows = [list(map(float, row)) for row in x]
        labels = [int(value) for value in y]
        self.trees = []
        for index in range(self.n_estimators):
            tree = ExtraTreeClassifier(
                max_depth=self.max_depth,
                min_samples_split=self.min_samples_split,
                max_features=self.max_features,
                seed=self.random_state + index,
            )
            tree.fit(rows, labels)
            self.trees.append(tree)
        n_features = len(rows[0]) if rows else 0
        totals = [0.0] * n_features
        for tree in self.trees:
            for position, value in enumerate(tree.importances):
                totals[position] += value
        divisor = float(len(self.trees)) or 1.0
        self.feature_importances_ = [value / divisor for value in totals]
        return self

    def predict_proba(self, x: Sequence[Sequence[float]]) -> List[List[float]]:
        if not self.trees:
            raise RuntimeError("Model is not fitted.")
        out: List[List[float]] = []
        for row in x:
            values = [float(value) for value in row]
            positive = sum(tree.probability(values) for tree in self.trees) / len(self.trees)
            positive = min(1.0, max(0.0, positive))
            out.append([1.0 - positive, positive])
        return out

    def predict(self, x: Sequence[Sequence[float]]) -> List[int]:
        return [1 if row[1] >= 0.5 else 0 for row in self.predict_proba(x)]

    def get_params(self) -> Dict[str, int]:
        return {
            "n_estimators": self.n_estimators,
            "max_depth": self.max_depth,
            "min_samples_split": self.min_samples_split,
            "max_features": self.max_features,
            "random_state": self.random_state,
        }
