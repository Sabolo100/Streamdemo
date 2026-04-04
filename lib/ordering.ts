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
  score += getPatternPriority(candidate.video.primaryPattern, role, inputs.focusArea);

  if (previous) {
    if (previous.video.primaryPattern === candidate.video.primaryPattern) {
      score -= 20;
    }

    if (
      inputs.level === "beginner" &&
      previous.video.positionType !== candidate.video.positionType &&
      previous.video.positionType !== "mixed" &&
      candidate.video.positionType !== "mixed"
    ) {
      score -= 9;
    }
  }

  if (role === "warmup" && candidate.video.primaryPattern === "mobility") {
    score += ordered.length === 0 ? 18 : 8;
  }

  if (role === "cooldown" && candidate.video.primaryPattern === "mobility") {
    score += 12;
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
  return index === -1 ? 0 : Math.max(0, 16 - index * 3);
}

function getPatternSequence(role: SessionRole, focusArea: WorkoutInputs["focusArea"]): string[] {
  switch (role) {
    case "warmup":
      return ["mobility", "squat", "hinge", "pull", "push", "core", "cardio_locomotion"];
    case "activation":
      return ["core", "hinge", "pull", "push", "squat", "balance_stability"];
    case "main":
      if (focusArea === "lower_body") {
        return ["squat", "hinge", "lunge", "push", "pull", "core", "cardio_locomotion"];
      }

      if (focusArea === "upper_body") {
        return ["push", "pull", "squat", "hinge", "core", "lunge", "cardio_locomotion"];
      }

      if (focusArea === "core") {
        return ["core", "hinge", "pull", "push", "lunge", "squat", "mobility"];
      }

      return ["squat", "push", "hinge", "pull", "lunge", "core", "cardio_locomotion"];
    case "accessory":
      return ["core", "balance_stability", "pull", "hinge", "lunge", "push", "mobility"];
    case "finisher":
      return ["cardio_locomotion", "squat", "lunge", "hinge", "push", "core"];
    case "cooldown":
      return ["mobility", "core", "hinge", "pull", "push", "lunge", "squat"];
    default:
      return ["squat", "push", "hinge", "pull", "lunge", "core"];
  }
}
