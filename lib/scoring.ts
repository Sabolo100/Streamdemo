import { getFocusLabel, getGoalLabel, getLevelLabel } from "@/lib/i18n";
import { getComplexityRank } from "@/lib/taxonomy";
import type {
  AppLanguage,
  BuilderTag,
  ScoredVideoCandidate,
  SelectedExercise,
  SessionRole,
  SlotDetail,
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

const PREP_TAGS: BuilderTag[] = ["prep_upper", "prep_lower", "prep_core", "prep_full"];
const ACTIVATION_TAGS: BuilderTag[] = [
  "activation_upper",
  "activation_lower",
  "activation_core",
  "activation_full",
];
const UPPER_PUSH_TAGS: BuilderTag[] = ["strength_upper_push", "push_pattern"];
const UPPER_PULL_TAGS: BuilderTag[] = ["strength_upper_pull", "pull_pattern"];
const LOWER_MAIN_TAGS: BuilderTag[] = [
  "strength_lower_squat",
  "strength_lower_hinge",
  "strength_lower_lunge",
  "squat_pattern",
  "hinge_pattern",
  "lunge_pattern",
];
const CORE_MAIN_TAGS: BuilderTag[] = ["strength_core", "accessory_core", "anti_rotation"];
const WARMUP_SLOTS: SlotDetail[] = ["warmup_mobility"];
const COOLDOWN_SLOTS: SlotDetail[] = [
  "cooldown_breathing",
  "cooldown_mobility",
  "cooldown_downregulation",
];

export function scoreVideo(video: VideoItem, context: ScoringContext): ScoredVideoCandidate {
  const { inputs, role } = context;
  let score = 0;

  score += 18 * getRoleFit(video, role);
  score += 14 * getGoalMatch(video, inputs.goal);
  score += 16 * getBuilderIntentMatch(video, context);
  score += 10 * getFocusMatch(video, inputs.focusArea, role);
  score += 9 * getLevelMatch(video, inputs.level);
  score += 10 * getImpactFit(video, inputs.impactTolerance, role);
  score += 10 * getLimitationSafety(video, inputs);
  score += 8 * getBeginnerFriendliness(video, inputs.level);
  score += 8 * getEnergyFit(video, inputs.energy, role);
  score += 6 * getStyleFit(video, inputs.stylePreference, role);
  score += 8 * getPrescriptionFit(video, role, inputs);
  score += 10 * getMovementClassFit(video, context);
  score += 8 * getVariationFit(video, context);
  score += video.homeSafe ? 6 : -12;
  score += getBalanceAdjustment(video, context);
  score += getPreparationAlignment(video, context);

  score -= getRedundancyPenalty(video, context);
  score -= getTransitionPenalty(video, context);
  score -= getComplexityPenalty(video, inputs.level, role);
  score -= getStructuralMismatchPenalty(video, context);

  return {
    video,
    score,
    whySelected: buildSelectionReason(video, context),
  };
}

function getRoleFit(video: VideoItem, role: SessionRole): number {
  if (hasAnySlotDetail(video, getDesiredSlotDetails(role))) {
    return 1;
  }

  if (video.sessionRoleFit.includes(role)) {
    return 1;
  }

  if (role === "warmup" && (video.primaryPattern === "mobility" || hasAnyBuilderTag(video, PREP_TAGS))) {
    return 0.9;
  }

  if (role === "cooldown" && video.primaryPattern === "mobility") {
    return 1;
  }

  if (role === "activation" && (hasAnyBuilderTag(video, ACTIVATION_TAGS) || video.primaryPattern === "core")) {
    return 0.88;
  }

  if (role === "accessory" && (video.primaryPattern === "core" || video.unilateral)) {
    return 0.85;
  }

  if (role === "finisher" && ["cardio_locomotion", "squat", "lunge"].includes(video.primaryPattern)) {
    return 0.75;
  }

  return 0.3;
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

  return 0.2;
}

function matchesRoleBucketFocus(
  video: VideoItem,
  role: SessionRole,
  inputs: WorkoutInputs,
): boolean {
  if (role === "main") {
    switch (inputs.focusArea) {
      case "upper_body":
        return ["upper_push", "upper_pull"].includes(video.balanceBucket);
      case "lower_body":
        return ["lower_knee", "lower_hip"].includes(video.balanceBucket);
      case "core":
        return video.balanceBucket === "trunk";
      case "full_body":
      default:
        return video.balanceBucket !== "mobility_recovery";
    }
  }

  if (role === "accessory") {
    switch (inputs.focusArea) {
      case "upper_body":
        return ["upper_push", "upper_pull", "trunk"].includes(video.balanceBucket);
      case "lower_body":
        return ["lower_knee", "lower_hip", "trunk"].includes(video.balanceBucket);
      case "core":
        return video.balanceBucket === "trunk";
      case "full_body":
      default:
        return true;
    }
  }

  return true;
}

function getBuilderIntentMatch(video: VideoItem, context: ScoringContext): number {
  const slotDetails = getDesiredSlotDetails(context.role, context.inputs);
  const tags = getDesiredBuilderTags(context.role, context.inputs);

  if (
    slotDetails.length > 0 &&
    hasAnySlotDetail(video, slotDetails) &&
    matchesRoleBucketFocus(video, context.role, context.inputs)
  ) {
    return 1;
  }

  if (tags.length > 0 && hasAnyBuilderTag(video, tags)) {
    return 1;
  }

  switch (context.role) {
    case "warmup":
      return video.primaryPattern === "mobility" ? 0.75 : 0.2;
    case "activation":
      return video.primaryPattern === "core" || video.primaryPattern === "balance_stability" ? 0.75 : 0.2;
    case "main":
      return matchesMainFallback(video, context.inputs) ? 0.72 : 0.18;
    case "accessory":
      return video.primaryPattern === "core" || video.unilateral ? 0.7 : 0.25;
    case "cooldown":
      return video.primaryPattern === "mobility" ? 0.85 : 0.15;
    case "finisher":
      return video.primaryPattern === "cardio_locomotion" ? 1 : 0.45;
    default:
      return 0.5;
  }
}

function getFocusMatch(
  video: VideoItem,
  focusArea: WorkoutInputs["focusArea"],
  role: SessionRole,
): number {
  if (focusArea === "full_body") {
    if (video.bodyRegion === "full_body") {
      return 1;
    }

    return role === "warmup" || role === "activation" || role === "cooldown" ? 0.8 : 0.6;
  }

  if (video.bodyRegion === focusArea) {
    return 1;
  }

  if (focusArea === "core" && video.primaryPattern === "core") {
    return 1;
  }

  if (video.bodyRegion === "core" && (role === "warmup" || role === "activation" || role === "cooldown")) {
    return 0.82;
  }

  if (video.bodyRegion === "full_body" && role === "main") {
    return 0.72;
  }

  return 0.3;
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

function getMovementClassFit(video: VideoItem, context: ScoringContext): number {
  switch (context.role) {
    case "warmup":
      if (video.movementClass === "mobility") {
        return 1;
      }

      if (video.movementClass === "recovery") {
        return 0.45;
      }

      return video.movementClass === "accessory" ? 0.6 : 0.15;
    case "activation":
      return video.movementClass === "accessory"
        ? 1
        : video.movementClass === "compound"
          ? 0.5
          : 0.15;
    case "main":
      if (context.inputs.goal === "conditioning" || context.inputs.goal === "fat_burn") {
        return ["compound", "conditioning", "power"].includes(video.movementClass) ? 1 : 0.2;
      }

      if (context.inputs.focusArea === "core") {
        return ["compound", "accessory"].includes(video.movementClass) ? 1 : 0.2;
      }

      return video.movementClass === "compound" ? 1 : video.movementClass === "accessory" ? 0.2 : 0.05;
    case "accessory":
      return video.movementClass === "accessory"
        ? 1
        : video.movementClass === "isolation"
          ? 0.85
          : video.movementClass === "compound"
            ? 0.55
            : 0.2;
    case "finisher":
      return ["conditioning", "power"].includes(video.movementClass) ? 1 : 0.5;
    case "cooldown":
      return ["mobility", "recovery"].includes(video.movementClass) ? 1 : 0.1;
    default:
      return 0.5;
  }
}

function getVariationFit(video: VideoItem, context: ScoringContext): number {
  if (video.variationTier === "standard") {
    return 1;
  }

  if (video.variationTier === "regression") {
    return context.inputs.level === "beginner" || ["warmup", "activation"].includes(context.role) ? 0.95 : 0.65;
  }

  if (video.variationTier === "progression") {
    return context.inputs.level === "beginner" ? 0.35 : 0.75;
  }

  return context.inputs.level === "advanced" ? 0.4 : 0.05;
}

function getPrescriptionFit(
  video: VideoItem,
  role: SessionRole,
  inputs: WorkoutInputs,
): number {
  switch (role) {
    case "warmup":
      if (video.prescriptionProfile === "mobility_prep" || video.prescriptionProfile === "recovery_reset") {
        return 1;
      }

      return video.preferredFormat === "reps" ? 0.3 : 0.75;
    case "activation":
      if (video.prescriptionProfile === "conditioning_interval") {
        return 0.6;
      }

      return ["core_control", "accessory_volume"].includes(video.prescriptionProfile) ? 1 : 0.75;
    case "main":
      if (inputs.goal === "conditioning" || inputs.goal === "fat_burn" || inputs.stylePreference === "interval") {
        return ["conditioning_interval", "power_output", "compound_strength"].includes(video.prescriptionProfile)
          ? 1
          : 0.55;
      }

      return video.prescriptionProfile === "compound_strength" ? 1 : video.prescriptionProfile === "core_control" ? 0.65 : 0.25;
    case "accessory":
      return ["accessory_volume", "isolation_volume", "core_control"].includes(video.prescriptionProfile)
        ? 1
        : 0.6;
    case "finisher":
      return ["conditioning_interval", "power_output"].includes(video.prescriptionProfile) ? 1 : 0.6;
    case "cooldown":
      return video.prescriptionProfile === "mobility_prep" || video.prescriptionProfile === "recovery_reset" ? 1 : 0.1;
    default:
      return 0.8;
  }
}

function getBalanceAdjustment(video: VideoItem, context: ScoringContext): number {
  const selected = [...context.sessionSelections, ...context.blockSelections];

  if (
    context.role === "main" &&
    context.inputs.focusArea === "upper_body" &&
    ["strength", "tone", "general_fitness"].includes(context.inputs.goal)
  ) {
    const pushCount = selected.filter((item) => item.video.balanceBucket === "upper_push").length;
    const pullCount = selected.filter((item) => item.video.balanceBucket === "upper_pull").length;
    const isPush = video.balanceBucket === "upper_push";
    const isPull = video.balanceBucket === "upper_pull";

    if (isPull && pullCount <= pushCount) {
      return 14;
    }

    if (isPush && pushCount < pullCount) {
      return 8;
    }

    if (isPush && pushCount > pullCount) {
      return -12;
    }

    if (!isPush && !isPull) {
      return -18;
    }
  }

  if (
    context.role === "main" &&
    context.inputs.focusArea === "full_body" &&
    ["strength", "tone", "general_fitness"].includes(context.inputs.goal)
  ) {
    const lowerCount = selected.filter((item) => ["lower_knee", "lower_hip"].includes(item.video.balanceBucket)).length;
    const upperPushCount = selected.filter((item) => item.video.balanceBucket === "upper_push").length;
    const upperPullCount = selected.filter((item) => item.video.balanceBucket === "upper_pull").length;
    const coreCount = selected.filter((item) => item.video.balanceBucket === "trunk").length;

    const isLower = ["lower_knee", "lower_hip"].includes(video.balanceBucket);
    const isUpperPush = video.balanceBucket === "upper_push";
    const isUpperPull = video.balanceBucket === "upper_pull";
    const isCore = video.balanceBucket === "trunk";

    if (isLower && lowerCount === 0) {
      return 22;
    }

    if (isUpperPush && upperPushCount === 0) {
      return 18;
    }

    if (isUpperPull && upperPullCount === 0) {
      return 10;
    }

    if (isCore && coreCount === 0) {
      return 8;
    }

    if (upperPushCount > 0 && lowerCount === 0 && isUpperPush) {
      return -18;
    }

    if (upperPushCount > 0 && lowerCount === 0 && isLower) {
      return 14;
    }

    if (upperPushCount > 0 && lowerCount > 0 && upperPullCount === 0 && isUpperPull) {
      return 10;
    }

    if (upperPushCount > 0 && lowerCount > 0 && isUpperPush) {
      return -10;
    }

    if (lowerCount > 0 && upperPushCount > 0 && coreCount === 0 && isCore) {
      return 8;
    }

    if (lowerCount >= 2 && upperPushCount === 0 && isLower) {
      return -16;
    }

    if (lowerCount >= 2 && upperPullCount === 0 && isLower) {
      return -10;
    }
  }

  if (
    context.role === "main" &&
    context.inputs.focusArea === "lower_body" &&
    ["strength", "tone", "general_fitness"].includes(context.inputs.goal)
  ) {
    const kneeCount = selected.filter((item) => item.video.balanceBucket === "lower_knee").length;
    const hipCount = selected.filter((item) => item.video.balanceBucket === "lower_hip").length;

    if (video.balanceBucket === "lower_knee" && kneeCount === 0) {
      return 12;
    }

    if (video.balanceBucket === "lower_hip" && hipCount === 0) {
      return 12;
    }

    if (video.balanceBucket === "lower_knee" && kneeCount > hipCount) {
      return -8;
    }

    if (video.balanceBucket === "lower_hip" && hipCount > kneeCount) {
      return -8;
    }
  }

  if (
    context.role === "accessory" &&
    context.inputs.focusArea === "upper_body" &&
    hasAnyBuilderTag(video, ["accessory_core", "strength_core", "anti_rotation"])
  ) {
    return 6;
  }

  if (
    ["warmup", "activation", "accessory"].includes(context.role) &&
    selected.every((item) => item.video.planeOfMotion === "sagittal") &&
    ["frontal", "transverse", "multiplanar"].includes(video.planeOfMotion)
  ) {
    return 5;
  }

  return 0;
}

function getPreparationAlignment(video: VideoItem, context: ScoringContext): number {
  const workSelections = context.sessionSelections.filter((item) => ["main", "accessory"].includes(item.role));
  if (workSelections.length === 0) {
    return 0;
  }

  const hasUpperWork = workSelections.some((item) =>
    ["upper_push", "upper_pull"].includes(item.video.balanceBucket),
  );
  const hasLowerWork = workSelections.some((item) =>
    ["lower_knee", "lower_hip"].includes(item.video.balanceBucket),
  );
  const hasCoreWork = workSelections.some((item) => item.video.balanceBucket === "trunk");

  if (context.role === "warmup" || context.role === "activation") {
    let score = 0;

    if (hasUpperWork && hasAnyBuilderTag(video, ["prep_upper", "activation_upper", "scapular_control"])) {
      score += 8;
    }
    if (hasLowerWork && hasAnyBuilderTag(video, ["prep_lower", "activation_lower", "mobility_hips"])) {
      score += 8;
    }
    if (hasCoreWork && hasAnyBuilderTag(video, ["prep_core", "activation_core", "anti_rotation"])) {
      score += 6;
    }

    if (!hasUpperWork && hasAnyBuilderTag(video, ["prep_upper", "activation_upper"])) {
      score -= 4;
    }
    if (!hasLowerWork && hasAnyBuilderTag(video, ["prep_lower", "activation_lower"])) {
      score -= 4;
    }

    return score;
  }

  if (context.role === "cooldown") {
    let score = 0;

    if (hasUpperWork && hasAnyBuilderTag(video, ["recovery_upper", "mobility_thoracic"])) {
      score += 8;
    }
    if (hasLowerWork && hasAnyBuilderTag(video, ["recovery_lower", "mobility_hips"])) {
      score += 8;
    }
    if (hasCoreWork && hasAnyBuilderTag(video, ["recovery_core", "recovery_breathing"])) {
      score += 6;
    }

    return score;
  }

  return 0;
}

function getRedundancyPenalty(video: VideoItem, context: ScoringContext): number {
  const allSelected = [...context.sessionSelections, ...context.blockSelections];
  let penalty = 0;

  if (allSelected.some((item) => item.video.id === video.id)) {
    penalty += 90;
  }

  const familyCount = allSelected.filter(
    (item) =>
      item.video.exerciseFamily &&
      video.exerciseFamily &&
      item.video.exerciseFamily === video.exerciseFamily,
  ).length;
  const familyPenaltyMultiplier =
    context.role === "warmup" || context.role === "activation" || context.role === "cooldown"
      ? 60
      : context.role === "accessory"
        ? 36
        : 24;
  penalty += familyCount * familyPenaltyMultiplier;

  const detailedFamilyCount = allSelected.filter(
    (item) =>
      item.video.movementFamilyDetailed &&
      video.movementFamilyDetailed &&
      item.video.movementFamilyDetailed === video.movementFamilyDetailed,
  ).length;
  penalty += detailedFamilyCount * (context.role === "warmup" || context.role === "activation" || context.role === "cooldown" ? 42 : 18);

  const patternCount = allSelected.filter((item) => item.video.primaryPattern === video.primaryPattern).length;
  penalty += patternCount * 6;

  const bucketCount = allSelected.filter((item) => item.video.balanceBucket === video.balanceBucket).length;
  if (context.role === "main" && bucketCount >= 2) {
    penalty += 10;
  }

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
    previous.video.exerciseFamily &&
    video.exerciseFamily &&
    previous.video.exerciseFamily === video.exerciseFamily
  ) {
    penalty += context.role === "warmup" || context.role === "activation" || context.role === "cooldown" ? 36 : 18;
  }

  if (
    context.inputs.level === "beginner" &&
    previous.video.positionDetail !== video.positionDetail
  ) {
    penalty += 6;
  }

  if (
    context.inputs.level === "beginner" &&
    previous.video.limbPattern === "unilateral" &&
    video.limbPattern === "unilateral"
  ) {
    penalty += 4;
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
  const technicalGatePenalty =
    video.technicalGates.includes("hanging") || video.technicalGates.includes("inversion")
      ? 4
      : video.technicalGates.includes("ballistic")
        ? 3
        : video.technicalGates.includes("overhead") && level === "beginner"
          ? 2
          : 0;

  if (role === "warmup" || role === "cooldown") {
    return rank * 5 + technicalGatePenalty;
  }

  if (level === "beginner") {
    return rank * 4 + technicalGatePenalty;
  }

  if (level === "lower_intermediate") {
    return rank * 2 + technicalGatePenalty;
  }

  return Math.max(0, rank - 1) + technicalGatePenalty;
}

function getStructuralMismatchPenalty(video: VideoItem, context: ScoringContext): number {
  const { role, inputs } = context;

  if (role === "main" && video.movementClass !== "compound") {
    if (inputs.goal === "conditioning" || inputs.goal === "fat_burn") {
      if (!["conditioning", "power"].includes(video.movementClass)) {
        return 24;
      }
    } else if (!(inputs.focusArea === "core" && video.movementClass === "accessory")) {
      return 28;
    }
  }

  if (role === "warmup" && ["compound", "isolation", "conditioning", "power"].includes(video.movementClass)) {
    return 24;
  }

  if (role === "cooldown" && !["mobility", "recovery"].includes(video.movementClass)) {
    return 28;
  }

  if (
    role === "warmup" &&
    !hasAnySlotDetail(video, getDesiredSlotDetails(role, inputs)) &&
    !hasAnyBuilderTag(video, getDesiredBuilderTags(role, inputs))
  ) {
    return video.primaryPattern === "mobility" ? 6 : 18;
  }

  if (
    role === "activation" &&
    !hasAnySlotDetail(video, getDesiredSlotDetails(role, inputs)) &&
    !hasAnyBuilderTag(video, getDesiredBuilderTags(role, inputs))
  ) {
    return video.primaryPattern === "core" || video.primaryPattern === "balance_stability" ? 6 : 18;
  }

  if (
    role === "main" &&
    inputs.focusArea === "upper_body" &&
    ["strength", "tone", "general_fitness"].includes(inputs.goal) &&
    !["upper_push", "upper_pull"].includes(video.balanceBucket)
  ) {
    return 18;
  }

  if (
    role === "main" &&
    inputs.focusArea === "full_body" &&
    ["strength", "tone", "general_fitness"].includes(inputs.goal) &&
    !["lower_knee", "lower_hip", "upper_push", "upper_pull", "trunk", "total_body"].includes(video.balanceBucket)
  ) {
    return 16;
  }

  if (
    role === "accessory" &&
    inputs.focusArea === "upper_body" &&
    hasAnyBuilderTag(video, ["accessory_lower", ...LOWER_MAIN_TAGS])
  ) {
    return 16;
  }

  if (
    role === "cooldown" &&
    inputs.focusArea === "upper_body" &&
    hasAnyBuilderTag(video, ["recovery_lower", "mobility_hips"])
  ) {
    return 12;
  }

  return 0;
}

function getDesiredBuilderTags(role: SessionRole, inputs: WorkoutInputs): BuilderTag[] {
  switch (role) {
    case "warmup":
      switch (inputs.focusArea) {
        case "upper_body":
          return ["prep_upper", "prep_core", "prep_full", "scapular_control", "mobility_thoracic"];
        case "lower_body":
          return ["prep_lower", "prep_core", "prep_full", "mobility_hips"];
        case "core":
          return ["prep_core", "prep_full"];
        case "full_body":
        default:
          return PREP_TAGS;
      }
    case "activation":
      switch (inputs.focusArea) {
        case "upper_body":
          return ["activation_upper", "activation_core", "scapular_control", "anti_rotation"];
        case "lower_body":
          return ["activation_lower", "activation_core", "activation_full"];
        case "core":
          return ["activation_core", "anti_rotation"];
        case "full_body":
        default:
          return ACTIVATION_TAGS;
      }
    case "main":
      switch (inputs.focusArea) {
        case "upper_body":
          return [...UPPER_PUSH_TAGS, ...UPPER_PULL_TAGS];
        case "lower_body":
          return LOWER_MAIN_TAGS;
        case "core":
          return CORE_MAIN_TAGS;
        case "full_body":
        default:
          return [
            "push_pattern",
            "pull_pattern",
            "squat_pattern",
            "hinge_pattern",
            "lunge_pattern",
            "strength_core",
          ];
      }
    case "accessory":
      switch (inputs.focusArea) {
        case "upper_body":
          return ["accessory_upper", "accessory_core", "strength_core", "anti_rotation"];
        case "lower_body":
          return ["accessory_lower", "accessory_core", "strength_core"];
        case "core":
          return ["accessory_core", "strength_core", "anti_rotation"];
        case "full_body":
        default:
          return ["accessory_upper", "accessory_lower", "accessory_core", "strength_core"];
      }
    case "cooldown":
      switch (inputs.focusArea) {
        case "upper_body":
          return ["recovery_upper", "recovery_core", "recovery_breathing", "mobility_thoracic"];
        case "lower_body":
          return ["recovery_lower", "recovery_core", "recovery_breathing", "mobility_hips"];
        case "core":
          return ["recovery_core", "recovery_breathing"];
        case "full_body":
        default:
          return ["recovery_upper", "recovery_lower", "recovery_core", "recovery_breathing"];
      }
    case "finisher":
      return [];
    default:
      return [];
  }
}

function getDesiredSlotDetails(role: SessionRole, inputs?: WorkoutInputs): SlotDetail[] {
  switch (role) {
    case "warmup":
      return WARMUP_SLOTS;
    case "activation":
      switch (inputs?.focusArea) {
        case "upper_body":
          return ["activation_scapula", "activation_core"];
        case "lower_body":
          return ["activation_glute", "activation_core"];
        case "core":
          return ["activation_core"];
        case "full_body":
        default:
          return ["activation_glute", "activation_core", "activation_scapula"];
      }
    case "main":
      if (inputs?.goal === "conditioning" || inputs?.goal === "fat_burn") {
        return ["main_strength", "conditioning", "power"];
      }
      return ["main_strength"];
    case "accessory":
      return ["accessory_strength", "skill"];
    case "finisher":
      return ["conditioning", "power"];
    case "cooldown":
      return COOLDOWN_SLOTS;
    default:
      return [];
  }
}

function matchesMainFallback(video: VideoItem, inputs: WorkoutInputs): boolean {
  switch (inputs.focusArea) {
    case "upper_body":
      return video.bodyRegion === "upper_body" && ["push", "pull"].includes(video.primaryPattern);
    case "lower_body":
      return (
        video.bodyRegion === "lower_body" &&
        ["squat", "hinge", "lunge"].includes(video.primaryPattern)
      );
    case "core":
      return video.bodyRegion === "core" || video.primaryPattern === "core";
    case "full_body":
    default:
      return ["squat", "hinge", "push", "pull", "lunge", "core"].includes(video.primaryPattern);
  }
}

function hasAnyBuilderTag(video: VideoItem, tags: readonly BuilderTag[]): boolean {
  return tags.some((tag) => video.builderTags.includes(tag));
}

function hasAnySlotDetail(video: VideoItem, slotDetails: readonly SlotDetail[]): boolean {
  return slotDetails.some((slotDetail) => video.slotDetails.includes(slotDetail));
}

export function buildSelectionReason(video: VideoItem, context: ScoringContext): string {
  const goalLabel = getGoalLabel(context.language, context.inputs.goal).toLowerCase();
  const focusLabel = getFocusLabel(context.language, context.inputs.focusArea).toLowerCase();
  const levelLabel = getLevelLabel(context.language, context.inputs.level).toLowerCase();

  if (context.language === "hu") {
    switch (context.role) {
      case "warmup":
        return `Alacsony fárasztású nyitó gyakorlat, ami fokozatosan vezet be a ${goalLabel} munkába.`;
      case "activation":
        return `Azért került be, hogy a fő ${focusLabel} terhelés előtt aktiválja a fontos izmokat.`;
      case "main":
        return `A ${levelLabel} szinthez illő ${focusLabel} fő gyakorlat, jó edzésértékkel.`;
      case "accessory":
        return `A fő blokkot támogatja stabilitással, egyensúllyal és jobb mozgásrotációval.`;
      case "finisher":
        return `Egyszerű, biztonságos lezárásnak került be, hogy megtartsa a tempót káosz nélkül.`;
      case "cooldown":
        return `Levezetésnek választottuk, alacsony terheléssel és mobilitási hangsúllyal.`;
      default:
        return `A session flow támogatására került be.`;
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
