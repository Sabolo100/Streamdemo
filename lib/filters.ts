import { getComplexityRank, getLevelRank, getImpactRank, resolveAllowedEquipment } from "@/lib/taxonomy";
import type {
  ImpactTolerance,
  PhysicalLimitation,
  SessionRole,
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

    switch (role) {
      case "warmup":
        return (
          getImpactRank(video.impactLevel) <= getImpactRank("medium") &&
          getComplexityRank(video.complexityLevel) <= getComplexityRank("moderate") &&
          video.intensityEstimate !== "high"
        );
      case "activation":
        return (
          getImpactRank(video.impactLevel) <= getImpactRank("medium") &&
          video.intensityEstimate !== "high" &&
          video.primaryPattern !== "cardio_locomotion"
        );
      case "main":
        return video.sessionRoleFit.includes("main") || video.sessionRoleFit.includes("finisher");
      case "accessory":
        return video.primaryPattern !== "cardio_locomotion" || inputs.goal === "conditioning";
      case "finisher":
        return (
          !video.advancedRisk &&
          getComplexityRank(video.complexityLevel) <= getComplexityRank("moderate")
        );
      case "cooldown":
        return (
          video.intensityEstimate === "low" &&
          getImpactRank(video.impactLevel) <= getImpactRank("low")
        );
      default:
        return true;
    }
  });
}

export function supportsRole(video: VideoItem, role: SessionRole): boolean {
  return video.sessionRoleFit.includes(role);
}

function matchesEquipment(video: VideoItem, allowedEquipment: Set<string>): boolean {
  return video.equipmentTypes.every((equipment) => allowedEquipment.has(equipment));
}

function matchesHomeSafety(video: VideoItem): boolean {
  return (
    video.homeSafe &&
    !video.requiresLargeSpace &&
    !video.requiresPartner &&
    !video.requiresGymSetup
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
      video.primaryPattern === "hinge" &&
      (video.advancedRisk || video.intensityEstimate === "high")
    ) {
      return false;
    }

    if (
      limitation === "shoulder_sensitive" &&
      video.primaryPattern === "push" &&
      video.bodyRegion === "upper_body"
    ) {
      return false;
    }

    if (
      limitation === "wrist_sensitive" &&
      (video.primaryPattern === "push" || video.positionType === "floor")
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

    if (video.beginnerFriendly === "no" || video.advancedRisk) {
      return false;
    }
  }

  if (inputs.level === "lower_intermediate" && video.complexityLevel === "complex") {
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
