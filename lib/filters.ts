import { getComplexityRank, getLevelRank, getImpactRank, resolveAllowedEquipment } from "@/lib/taxonomy";
import type {
  BuilderTag,
  ImpactTolerance,
  PhysicalLimitation,
  SessionRole,
  SlotDetail,
  VideoItem,
  WorkoutInputs,
} from "@/types/workout";

export interface FilterResult {
  candidates: VideoItem[];
  removedByRule: Record<string, number>;
}

const LIMITATION_TO_CONTRAINDICATION: Record<
  PhysicalLimitation,
  "knee_caution" | "lower_back_caution" | "wrist_shoulder_caution"
> = {
  knee_sensitive: "knee_caution",
  lower_back_sensitive: "lower_back_caution",
  shoulder_sensitive: "wrist_shoulder_caution",
  wrist_sensitive: "wrist_shoulder_caution",
};

export function buildCandidatePool(
  videos: VideoItem[],
  inputs: WorkoutInputs,
  excludedVideoIds: number[] = [],
): FilterResult {
  const removedByRule: Record<string, number> = {
    excluded: 0,
    contentKind: 0,
    assetKind: 0,
    builderStatus: 0,
    equipment: 0,
    homeSafety: 0,
    restrictions: 0,
    impact: 0,
    level: 0,
    goal: 0,
  };

  const excludedIds = new Set(excludedVideoIds);
  const allowedEquipment = resolveAllowedEquipment(inputs.equipment);
  const candidates: VideoItem[] = [];

  for (const video of videos) {
    if (excludedIds.has(video.id)) {
      removedByRule.excluded += 1;
      continue;
    }

    if (video.contentKind !== "exercise") {
      removedByRule.contentKind += 1;
      continue;
    }

    if (video.assetKind !== "exercise_single") {
      removedByRule.assetKind += 1;
      continue;
    }

    if (!matchesBuilderStatus(video, inputs)) {
      removedByRule.builderStatus += 1;
      continue;
    }

    if (!matchesEquipment(video, allowedEquipment)) {
      removedByRule.equipment += 1;
      continue;
    }

    if (!matchesHomeSafety(video)) {
      removedByRule.homeSafety += 1;
      continue;
    }

    if (!matchesRestrictions(video, inputs)) {
      removedByRule.restrictions += 1;
      continue;
    }

    if (!matchesImpactTolerance(video, inputs)) {
      removedByRule.impact += 1;
      continue;
    }

    if (!matchesLevel(video, inputs)) {
      removedByRule.level += 1;
      continue;
    }

    if (!matchesGoalBasicRelevance(video, inputs)) {
      removedByRule.goal += 1;
      continue;
    }

    candidates.push(video);
  }

  return { candidates, removedByRule };
}

export function filterCandidatesForRole(
  candidates: VideoItem[],
  role: SessionRole,
  inputs: WorkoutInputs,
): VideoItem[] {
  return candidates.filter((video) => {
    if (!supportsRole(video, role)) {
      return false;
    }

    if (!matchesMovementClassForRole(video, role, inputs)) {
      return false;
    }

    switch (role) {
      case "warmup":
        return (
          getImpactRank(video.impactLevel) <= getImpactRank("medium") &&
          getComplexityRank(video.complexityLevel) <= getComplexityRank("moderate") &&
          video.intensityEstimate !== "high" &&
          matchesRoleIntent(video, role, inputs)
        );
      case "activation":
        return (
          getImpactRank(video.impactLevel) <= getImpactRank("medium") &&
          video.intensityEstimate !== "high" &&
          video.primaryPattern !== "cardio_locomotion" &&
          matchesRoleIntent(video, role, inputs)
        );
      case "main":
        return (
          (video.sessionRoleFit.includes("main") || video.sessionRoleFit.includes("finisher")) &&
          matchesRoleIntent(video, role, inputs)
        );
      case "accessory":
        return (
          (video.primaryPattern !== "cardio_locomotion" || inputs.goal === "conditioning") &&
          matchesRoleIntent(video, role, inputs)
        );
      case "finisher":
        return (
          !video.advancedRisk &&
          getComplexityRank(video.complexityLevel) <= getComplexityRank("moderate") &&
          matchesRoleIntent(video, role, inputs)
        );
      case "cooldown":
        return (
          video.intensityEstimate === "low" &&
          getImpactRank(video.impactLevel) <= getImpactRank("low") &&
          matchesRoleIntent(video, role, inputs)
        );
      default:
        return true;
    }
  });
}

export function supportsRole(video: VideoItem, role: SessionRole): boolean {
  return video.sessionRoleFit.includes(role);
}

function matchesMovementClassForRole(
  video: VideoItem,
  role: SessionRole,
  inputs: WorkoutInputs,
): boolean {
  switch (role) {
    case "warmup":
      return (
        ["mobility", "recovery", "accessory"].includes(video.movementClass) &&
        video.movementClass !== "isolation" &&
        video.variationTier !== "specialist"
      );
    case "activation":
      return (
        ["accessory", "compound"].includes(video.movementClass) &&
        video.movementClass !== "isolation" &&
        video.variationTier !== "specialist"
      );
    case "main":
      if (inputs.goal === "conditioning" || inputs.goal === "fat_burn") {
        return ["compound", "conditioning", "power"].includes(video.movementClass);
      }

      if (inputs.focusArea === "core") {
        return ["compound", "accessory"].includes(video.movementClass);
      }

      return video.movementClass === "compound";
    case "accessory":
      return ["accessory", "isolation", "compound"].includes(video.movementClass);
    case "finisher":
      return ["conditioning", "power", "compound"].includes(video.movementClass);
    case "cooldown":
      return ["mobility", "recovery"].includes(video.movementClass);
    default:
      return true;
  }
}

function hasAnyBuilderTag(video: VideoItem, tags: readonly string[]): boolean {
  return tags.some((tag) => video.builderTags.includes(tag as BuilderTag));
}

function hasAnySlotDetail(video: VideoItem, slotDetails: readonly SlotDetail[]): boolean {
  return slotDetails.some((slotDetail) => video.slotDetails.includes(slotDetail));
}

function matchesFocusBodyRegion(video: VideoItem, inputs: WorkoutInputs): boolean {
  if (inputs.focusArea === "full_body") {
    return video.bodyRegion === "full_body";
  }

  if (inputs.focusArea === "core") {
    return video.bodyRegion === "core" || video.primaryPattern === "core";
  }

  return video.bodyRegion === inputs.focusArea;
}

function matchesBalanceBucketFocus(
  video: VideoItem,
  inputs: WorkoutInputs,
  role: SessionRole,
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

function getWarmupIntentTags(inputs: WorkoutInputs): string[] {
  switch (inputs.focusArea) {
    case "upper_body":
      return ["prep_upper", "prep_core", "prep_full", "scapular_control", "mobility_thoracic"];
    case "lower_body":
      return ["prep_lower", "prep_core", "prep_full", "mobility_hips"];
    case "core":
      return ["prep_core", "prep_full", "recovery_breathing"];
    case "full_body":
    default:
      return ["prep_upper", "prep_lower", "prep_core", "prep_full"];
  }
}

function getWarmupIntentSlots(): SlotDetail[] {
  return ["warmup_mobility"];
}

function getActivationIntentTags(inputs: WorkoutInputs): string[] {
  switch (inputs.focusArea) {
    case "upper_body":
      return ["activation_upper", "activation_core", "activation_full", "scapular_control", "anti_rotation"];
    case "lower_body":
      return ["activation_lower", "activation_core", "activation_full"];
    case "core":
      return ["activation_core", "activation_full", "anti_rotation"];
    case "full_body":
    default:
      return ["activation_upper", "activation_lower", "activation_core", "activation_full"];
  }
}

function getActivationIntentSlots(inputs: WorkoutInputs): SlotDetail[] {
  switch (inputs.focusArea) {
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
}

function getMainIntentTags(inputs: WorkoutInputs): string[] {
  switch (inputs.focusArea) {
    case "upper_body":
      return ["strength_upper_push", "strength_upper_pull", "push_pattern", "pull_pattern"];
    case "lower_body":
      return ["strength_lower_squat", "strength_lower_hinge", "strength_lower_lunge", "squat_pattern", "hinge_pattern", "lunge_pattern"];
    case "core":
      return ["strength_core", "anti_rotation", "accessory_core"];
    case "full_body":
    default:
      return ["push_pattern", "pull_pattern", "squat_pattern", "hinge_pattern", "lunge_pattern", "strength_core"];
  }
}

function getMainIntentSlots(inputs: WorkoutInputs): SlotDetail[] {
  if (inputs.goal === "conditioning" || inputs.goal === "fat_burn") {
    return ["main_strength", "conditioning", "power"];
  }

  return ["main_strength"];
}

function getAccessoryIntentTags(inputs: WorkoutInputs): string[] {
  switch (inputs.focusArea) {
    case "upper_body":
      return ["accessory_upper", "accessory_core", "strength_core", "anti_rotation", "pull_pattern", "push_pattern"];
    case "lower_body":
      return ["accessory_lower", "accessory_core", "strength_core", "squat_pattern", "hinge_pattern", "lunge_pattern"];
    case "core":
      return ["accessory_core", "strength_core", "anti_rotation"];
    case "full_body":
    default:
      return ["accessory_upper", "accessory_lower", "accessory_core", "strength_core"];
  }
}

function getAccessoryIntentSlots(): SlotDetail[] {
  return ["accessory_strength", "skill"];
}

function getCooldownIntentTags(inputs: WorkoutInputs): string[] {
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
}

function getCooldownIntentSlots(): SlotDetail[] {
  return ["cooldown_breathing", "cooldown_mobility", "cooldown_downregulation"];
}

function matchesRoleIntent(video: VideoItem, role: SessionRole, inputs: WorkoutInputs): boolean {
  switch (role) {
    case "warmup":
      if (inputs.focusArea === "full_body") {
        return (
          hasAnySlotDetail(video, getWarmupIntentSlots()) ||
          hasAnyBuilderTag(video, getWarmupIntentTags(inputs)) ||
          video.primaryPattern === "mobility"
        );
      }

      return hasAnyBuilderTag(video, getWarmupIntentTags(inputs));
    case "activation":
      return (
        hasAnySlotDetail(video, getActivationIntentSlots(inputs)) ||
        hasAnyBuilderTag(video, getActivationIntentTags(inputs)) ||
        ((video.primaryPattern === "core" || video.primaryPattern === "balance_stability") &&
          (inputs.focusArea === "full_body" || matchesFocusBodyRegion(video, inputs)))
      );
    case "main":
      if (inputs.goal === "mobility" || inputs.goal === "low_impact") {
        return video.primaryPattern !== "cardio_locomotion";
      }

      return (
        (hasAnySlotDetail(video, getMainIntentSlots(inputs)) &&
          matchesBalanceBucketFocus(video, inputs, role)) ||
        hasAnyBuilderTag(video, getMainIntentTags(inputs)) ||
        ((video.primaryPattern === "push" || video.primaryPattern === "pull") &&
          inputs.focusArea === "upper_body") ||
        ((video.primaryPattern === "squat" ||
          video.primaryPattern === "hinge" ||
          video.primaryPattern === "lunge") &&
          inputs.focusArea === "lower_body") ||
        (matchesFocusBodyRegion(video, inputs) &&
          (inputs.focusArea !== "full_body" ||
            inputs.goal === "conditioning" ||
            inputs.goal === "fat_burn" ||
            video.primaryPattern !== "cardio_locomotion"))
      );
    case "accessory":
      return (
        (hasAnySlotDetail(video, getAccessoryIntentSlots()) &&
          matchesBalanceBucketFocus(video, inputs, role)) ||
        hasAnyBuilderTag(video, getAccessoryIntentTags(inputs)) ||
        video.primaryPattern === "core" ||
        (
          inputs.focusArea === "full_body" &&
          video.bodyRegion !== "full_body" &&
          video.balanceBucket !== "mobility_recovery"
        )
      );
    case "finisher":
      return (
        video.slotDetails.includes("conditioning") ||
        video.slotDetails.includes("power") ||
        inputs.goal === "conditioning" ||
        inputs.goal === "fat_burn" ||
        video.primaryPattern !== "mobility"
      );
    case "cooldown":
      if (inputs.focusArea === "full_body") {
        return (
          hasAnySlotDetail(video, getCooldownIntentSlots()) ||
          hasAnyBuilderTag(video, getCooldownIntentTags(inputs)) ||
          video.primaryPattern === "mobility"
        );
      }

      return hasAnyBuilderTag(video, getCooldownIntentTags(inputs));
    default:
      return true;
  }
}

function matchesEquipment(video: VideoItem, allowedEquipment: Set<string>): boolean {
  return video.equipmentTypes.every((equipment) => allowedEquipment.has(equipment));
}

function matchesBuilderStatus(video: VideoItem, inputs: WorkoutInputs): boolean {
  if (video.builderStatus === "exclude") {
    return false;
  }

  if (video.builderStatus === "manual_review") {
    return (
      inputs.level === "advanced" &&
      !inputs.simpleMode &&
      inputs.physicalLimitations.length === 0
    );
  }

  return true;
}

function matchesHomeSafety(video: VideoItem): boolean {
  return (
    video.homeSafe &&
    !video.requiresLargeSpace &&
    !video.requiresPartner &&
    !["commercial_gym_preferred", "hanging_rig_needed"].includes(video.environmentAccess)
  );
}

function matchesRestrictions(video: VideoItem, inputs: WorkoutInputs): boolean {
  for (const limitation of inputs.physicalLimitations) {
    const flag = LIMITATION_TO_CONTRAINDICATION[limitation];

    if (video.contraindications.includes(flag)) {
      return false;
    }

    if (limitation === "knee_sensitive" && video.impactLevel === "high") {
      return false;
    }

    if (
      limitation === "lower_back_sensitive" &&
      (
        video.primaryPattern === "hinge" ||
        video.technicalGates.includes("ballistic")
      ) &&
      (video.advancedRisk || video.intensityEstimate === "high")
    ) {
      return false;
    }

    if (
      limitation === "shoulder_sensitive" &&
      (
        (video.primaryPattern === "push" && video.bodyRegion === "upper_body") ||
        video.technicalGates.includes("overhead")
      )
    ) {
      return false;
    }

    if (
      limitation === "wrist_sensitive" &&
      (
        video.primaryPattern === "push" ||
        ["plank", "quadruped"].includes(video.positionDetail)
      )
    ) {
      return false;
    }
  }

  return true;
}

function matchesImpactTolerance(video: VideoItem, inputs: WorkoutInputs): boolean {
  const impact = video.impactLevel;

  if (inputs.impactTolerance === "high") {
    return true;
  }

  if (inputs.impactTolerance === "medium") {
    if (impact !== "high") {
      return true;
    }

    return (
      inputs.goal === "fat_burn" ||
      inputs.goal === "conditioning" ||
      (inputs.level !== "beginner" && inputs.energy === "high")
    );
  }

  if (impact === "high") {
    return false;
  }

  return true;
}

function matchesLevel(video: VideoItem, inputs: WorkoutInputs): boolean {
  const levelRank = getLevelRank(inputs.level);
  const complexityRank = getComplexityRank(video.complexityLevel);

  if (inputs.level === "beginner") {
    if (complexityRank > getComplexityRank("moderate")) {
      return false;
    }

    if (video.technicalGates.some((gate) => ["hanging", "inversion", "ballistic", "complex_skill"].includes(gate))) {
      return false;
    }

    if (video.beginnerFriendly === "no" || video.advancedRisk) {
      return false;
    }
  }

  if (
    inputs.level === "lower_intermediate" &&
    (video.complexityLevel === "complex" ||
      video.technicalGates.some((gate) => ["hanging", "inversion", "complex_skill"].includes(gate)))
  ) {
    return false;
  }

  if (
    levelRank <= getLevelRank("intermediate") &&
    video.advancedRisk &&
    video.complexityLevel === "complex"
  ) {
    return false;
  }

  return true;
}

function matchesGoalBasicRelevance(video: VideoItem, inputs: WorkoutInputs): boolean {
  switch (inputs.goal) {
    case "mobility":
      return (
        video.primaryPattern === "mobility" ||
        video.primaryPattern === "core" ||
        video.primaryPattern === "balance_stability"
      );
    case "core":
      return (
        video.bodyRegion === "core" ||
        video.primaryPattern === "core" ||
        video.primaryPattern === "hinge" ||
        video.primaryPattern === "pull"
      );
    case "low_impact":
      return video.impactLevel !== "high";
    case "fat_burn":
    case "conditioning":
      return video.primaryPattern !== "mobility" || video.sessionRoleFit.includes("warmup");
    default:
      return true;
  }
}

export function isLowImpact(impactLevel: ImpactTolerance): boolean {
  return impactLevel === "low";
}
