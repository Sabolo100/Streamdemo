import type { ScoredVideoCandidate, SessionRole, WorkoutInputs } from "@/types/workout";

export function orderBlockExercises(
  candidates: ScoredVideoCandidate[],
  role: SessionRole,
  inputs: WorkoutInputs,
): ScoredVideoCandidate[] {
  const remaining = [...candidates];
  const ordered: ScoredVideoCandidate[] = [];

  while (remaining.length > 0) {
    remaining.sort((left, right) => {
      const rightScore = getOrderScore(right, ordered, role, inputs);
      const leftScore = getOrderScore(left, ordered, role, inputs);
      return rightScore - leftScore;
    });

    ordered.push(remaining.shift()!);
  }

  return ordered;
}

function getOrderScore(
  candidate: ScoredVideoCandidate,
  ordered: ScoredVideoCandidate[],
  role: SessionRole,
  inputs: WorkoutInputs,
): number {
  const previous = ordered.at(-1);
  let score = candidate.score;

  score += getMovementClassPriority(candidate.video.movementClass, role, ordered.length);
  score += getVariationPriority(candidate.video.variationTier, inputs.level, role);
  score += getPatternPriority(candidate.video.primaryPattern, role, inputs.focusArea);
  score += getBucketPriority(candidate, ordered, role, inputs);

  if (previous) {
    if (previous.video.primaryPattern === candidate.video.primaryPattern) {
      score -= role === "main" ? 14 : 10;
    }

    if (previous.video.movementClass === candidate.video.movementClass) {
      score -= role === "accessory" ? 4 : 2;
    }

    if (
      inputs.level === "beginner" &&
      previous.video.positionType !== candidate.video.positionType &&
      previous.video.positionType !== "mixed" &&
      candidate.video.positionType !== "mixed"
    ) {
      score -= 8;
    }
  }

  if (role === "main" && ordered.length > 0 && candidate.video.movementClass !== "compound") {
    score -= 20;
  }

  if (role === "accessory" && candidate.video.movementClass === "isolation" && ordered.length === 0) {
    score -= 12;
  }

  if (role === "cooldown" && candidate.video.movementClass === "recovery" && ordered.length === 0) {
    score -= 16;
  }

  return score;
}

function getMovementClassPriority(
  movementClass: string,
  role: SessionRole,
  orderedCount: number,
): number {
  switch (role) {
    case "warmup":
      if (movementClass === "mobility") {
        return orderedCount === 0 ? 18 : 12;
      }
      if (movementClass === "recovery") {
        return 2;
      }
      if (movementClass === "accessory") {
        return 6;
      }
      return -8;
    case "activation":
      if (movementClass === "accessory") {
        return orderedCount === 0 ? 16 : 10;
      }
      if (movementClass === "compound") {
        return 4;
      }
      return -10;
    case "main":
      if (movementClass === "compound") {
        return orderedCount === 0 ? 20 : 14;
      }
      if (movementClass === "power" || movementClass === "conditioning") {
        return 2;
      }
      if (movementClass === "accessory") {
        return -12;
      }
      return -18;
    case "accessory":
      if (movementClass === "accessory") {
        return orderedCount === 0 ? 14 : 10;
      }
      if (movementClass === "isolation") {
        return 2;
      }
      if (movementClass === "compound") {
        return 0;
      }
      return -8;
    case "finisher":
      if (movementClass === "conditioning" || movementClass === "power") {
        return 16;
      }
      return 2;
    case "cooldown":
      if (movementClass === "mobility") {
        return orderedCount === 0 ? 16 : 10;
      }
      if (movementClass === "recovery") {
        return orderedCount === 0 ? 2 : 14;
      }
      return -12;
    default:
      return 0;
  }
}

function getVariationPriority(
  variationTier: string,
  level: WorkoutInputs["level"],
  role: SessionRole,
): number {
  if (variationTier === "regression") {
    return level === "beginner" || role === "warmup" || role === "activation" ? 10 : 4;
  }

  if (variationTier === "standard") {
    return 12;
  }

  if (variationTier === "progression") {
    return level === "beginner" ? -6 : 3;
  }

  return level === "advanced" ? -2 : -14;
}

function getBucketPriority(
  candidate: ScoredVideoCandidate,
  ordered: ScoredVideoCandidate[],
  role: SessionRole,
  inputs: WorkoutInputs,
): number {
  if (role !== "main") {
    return 0;
  }

  const sequence = getBucketSequence(inputs.focusArea);
  const index = sequence.indexOf(candidate.video.balanceBucket);
  let score = index === -1 ? 0 : Math.max(0, 14 - index * 3);

  if (inputs.focusArea === "full_body") {
    const previous = ordered.at(-1);
    if (previous && previous.video.balanceBucket === candidate.video.balanceBucket) {
      score -= 10;
    }
  }

  return score;
}

function getPatternPriority(
  pattern: string,
  role: SessionRole,
  focusArea: WorkoutInputs["focusArea"],
): number {
  const sequence = getPatternSequence(role, focusArea);
  const index = sequence.indexOf(pattern);
  return index === -1 ? 0 : Math.max(0, 12 - index * 2);
}

function getPatternSequence(role: SessionRole, focusArea: WorkoutInputs["focusArea"]): string[] {
  switch (role) {
    case "warmup":
      return ["mobility", "core", "squat", "hinge", "pull", "push"];
    case "activation":
      return ["core", "pull", "hinge", "push", "squat", "balance_stability"];
    case "main":
      if (focusArea === "lower_body") {
        return ["squat", "hinge", "lunge", "push", "pull", "core"];
      }

      if (focusArea === "upper_body") {
        return ["push", "pull", "core", "squat", "hinge", "lunge"];
      }

      if (focusArea === "core") {
        return ["core", "hinge", "pull", "push", "lunge", "squat"];
      }

      return ["squat", "push", "pull", "hinge", "lunge", "core"];
    case "accessory":
      return ["core", "pull", "push", "hinge", "lunge", "squat", "balance_stability"];
    case "finisher":
      return ["cardio_locomotion", "squat", "lunge", "hinge", "push", "core"];
    case "cooldown":
      return ["mobility", "core", "hinge", "pull", "push", "lunge", "squat"];
    default:
      return ["squat", "push", "hinge", "pull", "lunge", "core"];
  }
}

function getBucketSequence(focusArea: WorkoutInputs["focusArea"]): string[] {
  switch (focusArea) {
    case "upper_body":
      return ["upper_push", "upper_pull", "trunk"];
    case "lower_body":
      return ["lower_knee", "lower_hip", "trunk"];
    case "core":
      return ["trunk", "upper_pull", "lower_hip"];
    case "full_body":
    default:
      return ["lower_knee", "upper_push", "upper_pull", "lower_hip", "trunk", "total_body"];
  }
}
