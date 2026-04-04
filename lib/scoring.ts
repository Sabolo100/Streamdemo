import {
  getFocusLabel,
  getGoalLabel,
  getLevelLabel,
} from "@/lib/i18n";
import { getComplexityRank } from "@/lib/taxonomy";
import type {
  AppLanguage,
  ScoredVideoCandidate,
  SelectedExercise,
  SessionRole,
  VideoItem,
  WorkoutInputs,
} from "@/types/workout";

export interface ScoringContext {
  role: SessionRole;
  inputs: WorkoutInputs;
  language: AppLanguage;
  sessionSelections: SelectedExercise[];
  blockSelections: SelectedExercise[];
}

const GOAL_PATTERN_WEIGHTS: Record<string, string[]> = {
  general_fitness: ["squat", "hinge", "push", "pull", "lunge", "core"],
  strength: ["squat", "hinge", "push", "pull", "lunge"],
  tone: ["squat", "hinge", "push", "pull", "lunge", "core"],
  fat_burn: ["cardio_locomotion", "squat", "lunge", "push", "hinge"],
  conditioning: ["cardio_locomotion", "squat", "lunge", "hinge", "push"],
  mobility: ["mobility", "balance_stability", "core"],
  core: ["core", "balance_stability", "hinge", "pull"],
  low_impact: ["mobility", "squat", "hinge", "pull", "core"],
};

export function scoreVideo(video: VideoItem, context: ScoringContext): ScoredVideoCandidate {
  const { inputs, role } = context;
  let score = 0;

  score += 18 * getRoleFit(video, role);
  score += 14 * getGoalMatch(video, inputs.goal);
  score += 10 * getFocusMatch(video, inputs.focusArea, role);
  score += 9 * getLevelMatch(video, inputs.level);
  score += 10 * getImpactFit(video, inputs.impactTolerance, role);
  score += 10 * getLimitationSafety(video, inputs);
  score += 8 * getBeginnerFriendliness(video, inputs.level);
  score += 8 * getEnergyFit(video, inputs.energy, role);
  score += 6 * getStyleFit(video, inputs.stylePreference, role);
  score += video.homeSafe ? 6 : -12;

  score -= getRedundancyPenalty(video, context);
  score -= getTransitionPenalty(video, context);
  score -= getComplexityPenalty(video, inputs.level, role);

  return {
    video,
    score,
    whySelected: buildSelectionReason(video, context),
  };
}

function getRoleFit(video: VideoItem, role: SessionRole): number {
  if (video.sessionRoleFit.includes(role)) {
    return 1;
  }

  if (role === "warmup" && video.primaryPattern === "mobility") {
    return 0.9;
  }

  if (role === "cooldown" && video.primaryPattern === "mobility") {
    return 1;
  }

  if (role === "activation" && ["core", "balance_stability", "hinge"].includes(video.primaryPattern)) {
    return 0.85;
  }

  if (role === "accessory" && (video.primaryPattern === "core" || video.unilateral)) {
    return 0.85;
  }

  if (role === "finisher" && ["cardio_locomotion", "squat", "lunge"].includes(video.primaryPattern)) {
    return 0.75;
  }

  return 0.35;
}

function getGoalMatch(video: VideoItem, goal: WorkoutInputs["goal"]): number {
  const preferredPatterns = GOAL_PATTERN_WEIGHTS[goal];

  if (preferredPatterns.includes(video.primaryPattern)) {
    return 1;
  }

  if (video.secondaryPattern && preferredPatterns.includes(video.secondaryPattern)) {
    return 0.65;
  }

  if (goal === "general_fitness" && video.bodyRegion === "full_body") {
    return 0.8;
  }

  return 0.25;
}

function getFocusMatch(
  video: VideoItem,
  focusArea: WorkoutInputs["focusArea"],
  role: SessionRole,
): number {
  if (role === "warmup" || role === "cooldown") {
    return video.primaryPattern === "mobility" ? 0.9 : 0.55;
  }

  if (focusArea === "full_body") {
    return video.bodyRegion === "full_body" ? 1 : 0.55;
  }

  if (video.bodyRegion === focusArea) {
    return 1;
  }

  if (focusArea === "core" && video.primaryPattern === "core") {
    return 1;
  }

  return 0.35;
}

function getLevelMatch(video: VideoItem, level: WorkoutInputs["level"]): number {
  if (level === "advanced") {
    return 1;
  }

  if (level === "intermediate") {
    return video.complexityLevel === "complex" ? 0.7 : 1;
  }

  if (level === "lower_intermediate") {
    if (video.complexityLevel === "complex") {
      return 0.1;
    }

    return video.beginnerFriendly === "no" ? 0.45 : 0.9;
  }

  if (video.beginnerFriendly === "yes") {
    return 1;
  }

  return video.beginnerFriendly === "conditional" ? 0.55 : 0.1;
}

function getImpactFit(
  video: VideoItem,
  impactTolerance: WorkoutInputs["impactTolerance"],
  role: SessionRole,
): number {
  if (role === "cooldown") {
    return video.impactLevel === "low" ? 1 : 0.1;
  }

  if (impactTolerance === "high") {
    return 1;
  }

  if (impactTolerance === "medium") {
    if (video.impactLevel === "high") {
      return 0.45;
    }

    return 1;
  }

  if (video.impactLevel === "low") {
    return 1;
  }

  return 0.45;
}

function getLimitationSafety(video: VideoItem, inputs: WorkoutInputs): number {
  let score = 1;

  if (inputs.physicalLimitations.includes("knee_sensitive")) {
    if (video.impactLevel !== "low") {
      score -= 0.35;
    }

    if (video.primaryPattern === "hinge" || video.primaryPattern === "mobility") {
      score += 0.1;
    }
  }

  if (inputs.physicalLimitations.includes("lower_back_sensitive")) {
    if (video.primaryPattern === "hinge") {
      score -= 0.3;
    }

    if (video.primaryPattern === "core" || video.primaryPattern === "mobility") {
      score += 0.12;
    }
  }

  if (inputs.physicalLimitations.includes("shoulder_sensitive")) {
    if (video.primaryPattern === "push") {
      score -= 0.3;
    }

    if (video.primaryPattern === "pull" || video.primaryPattern === "mobility") {
      score += 0.1;
    }
  }

  if (inputs.physicalLimitations.includes("wrist_sensitive")) {
    if (video.positionType === "floor") {
      score -= 0.25;
    }

    if (video.positionType === "standing") {
      score += 0.1;
    }
  }

  return Math.max(0.1, score);
}

function getBeginnerFriendliness(video: VideoItem, level: WorkoutInputs["level"]): number {
  if (level !== "beginner") {
    return 0.8;
  }

  if (video.beginnerFriendly === "yes") {
    return 1;
  }

  return video.beginnerFriendly === "conditional" ? 0.5 : 0.1;
}

function getEnergyFit(video: VideoItem, energy: WorkoutInputs["energy"], role: SessionRole): number {
  if (role === "cooldown") {
    return 1;
  }

  if (energy === "low") {
    return video.intensityEstimate === "low" ? 1 : 0.55;
  }

  if (energy === "medium") {
    return video.intensityEstimate === "high" ? 0.6 : 1;
  }

  return video.intensityEstimate === "high" ? 1 : 0.8;
}

function getStyleFit(video: VideoItem, style: WorkoutInputs["stylePreference"], role: SessionRole): number {
  switch (style) {
    case "steady":
      return video.primaryPattern === "mobility" || video.impactLevel === "low" ? 1 : 0.7;
    case "interval":
      return role === "main" || role === "finisher"
        ? video.positionType === "standing"
          ? 1
          : 0.7
        : 0.8;
    case "strength":
      return ["squat", "hinge", "push", "pull", "lunge"].includes(video.primaryPattern) ? 1 : 0.65;
    case "flow":
      return video.positionType !== "mixed" ? 0.9 : 0.75;
    default:
      return 0.75;
  }
}

function getRedundancyPenalty(video: VideoItem, context: ScoringContext): number {
  const allSelected = [...context.sessionSelections, ...context.blockSelections];
  let penalty = 0;

  if (allSelected.some((item) => item.video.id === video.id)) {
    penalty += 90;
  }

  const patternCount = allSelected.filter((item) => item.video.primaryPattern === video.primaryPattern).length;
  penalty += patternCount * 6;

  const regionCount = allSelected.filter((item) => item.video.bodyRegion === video.bodyRegion).length;
  if (context.role === "main" && regionCount >= 3) {
    penalty += 5;
  }

  return penalty;
}

function getTransitionPenalty(video: VideoItem, context: ScoringContext): number {
  const previous = context.blockSelections.at(-1);

  if (!previous) {
    return 0;
  }

  let penalty = 0;

  if (previous.video.primaryPattern === video.primaryPattern) {
    penalty += 9;
  }

  if (
    context.inputs.level === "beginner" &&
    previous.video.positionType !== video.positionType &&
    previous.video.positionType !== "mixed" &&
    video.positionType !== "mixed"
  ) {
    penalty += 6;
  }

  const previousEquipment = previous.video.equipmentTypes[0];
  const nextEquipment = video.equipmentTypes[0];
  if (
    previousEquipment &&
    nextEquipment &&
    previousEquipment !== nextEquipment &&
    previousEquipment !== "bodyweight" &&
    nextEquipment !== "bodyweight"
  ) {
    penalty += 5;
  }

  return penalty;
}

function getComplexityPenalty(video: VideoItem, level: WorkoutInputs["level"], role: SessionRole): number {
  const rank = getComplexityRank(video.complexityLevel);

  if (role === "warmup" || role === "cooldown") {
    return rank * 5;
  }

  if (level === "beginner") {
    return rank * 4;
  }

  if (level === "lower_intermediate") {
    return rank * 2;
  }

  return Math.max(0, rank - 1);
}

export function buildSelectionReason(video: VideoItem, context: ScoringContext): string {
  const goalLabel = getGoalLabel(context.language, context.inputs.goal).toLowerCase();
  const focusLabel = getFocusLabel(context.language, context.inputs.focusArea).toLowerCase();
  const levelLabel = getLevelLabel(context.language, context.inputs.level).toLowerCase();

  if (context.language === "hu") {
    switch (context.role) {
      case "warmup":
        return `Alacsony f\u00e1raszt\u00e1s\u00fa nyit\u00f3 gyakorlat, ami fokozatosan vezet be a ${goalLabel} munk\u00e1ba.`;
      case "activation":
        return `Az\u00e9rt ker\u00fclt be, hogy a f\u0151 ${focusLabel} terhel\u00e9s el\u0151tt aktiv\u00e1lja a fontos izmokat.`;
      case "main":
        return `A ${levelLabel} szinthez ill\u0151 ${focusLabel} f\u0151 gyakorlat, j\u00f3 edz\u00e9s\u00e9rt\u00e9kkel.`;
      case "accessory":
        return `A f\u0151 blokkot t\u00e1mogatja stabilit\u00e1ssal, egyens\u00fallyal \u00e9s jobb mozg\u00e1srot\u00e1ci\u00f3val.`;
      case "finisher":
        return `Egyszer\u0171, biztons\u00e1gos lez\u00e1r\u00e1snak ker\u00fclt be, hogy megtartsa a temp\u00f3t k\u00e1osz n\u00e9lk\u00fcl.`;
      case "cooldown":
        return `Levezet\u00e9snek v\u00e1lasztottuk, alacsony terhel\u00e9ssel \u00e9s mobilit\u00e1si hangs\u00fallyal.`;
      default:
        return `A session flow t\u00e1mogat\u00e1s\u00e1ra ker\u00fclt be.`;
    }
  }

  switch (context.role) {
    case "warmup":
      return `Selected as low-fatigue prep to open the session and ease into ${goalLabel} work.`;
    case "activation":
      return `Chosen to prime the key muscles before the ${focusLabel} workload starts.`;
    case "main":
      return `Chosen as a ${levelLabel}-appropriate ${focusLabel} main movement with clear training value.`;
    case "accessory":
      return `Used to support the main block with stability, balance, and cleaner movement rotation.`;
    case "finisher":
      return `Added as a simple repeatable finisher that keeps the pace up without adding chaos.`;
    case "cooldown":
      return `Selected to bring the session down with low-impact recovery and mobility emphasis.`;
    default:
      return `Selected to support the workout flow.`;
  }
}
