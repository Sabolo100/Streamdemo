import type {
  BodyRegion,
  DurationMinutes,
  EnergyLevel,
  EquipmentOption,
  EquipmentType,
  FocusArea,
  Goal,
  ImpactTolerance,
  IntensityEstimate,
  Level,
  PhysicalLimitation,
  SessionRole,
  StylePreference,
  WorkoutInputs,
} from "@/types/workout";

export const GOAL_OPTIONS: Goal[] = [
  "general_fitness",
  "strength",
  "tone",
  "fat_burn",
  "conditioning",
  "mobility",
  "core",
  "low_impact",
];

export const DURATION_OPTIONS: DurationMinutes[] = [30, 45, 60];

export const LEVEL_OPTIONS: Level[] = [
  "beginner",
  "lower_intermediate",
  "intermediate",
  "advanced",
];

export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  "bodyweight_only",
  "dumbbell",
  "kettlebell",
  "band",
  "trx",
  "bench_or_box",
  "mixed_light_equipment",
];

export const FOCUS_OPTIONS: FocusArea[] = [
  "full_body",
  "lower_body",
  "upper_body",
  "core",
];

export const IMPACT_OPTIONS: ImpactTolerance[] = ["low", "medium", "high"];

export const LIMITATION_OPTIONS: PhysicalLimitation[] = [
  "knee_sensitive",
  "lower_back_sensitive",
  "shoulder_sensitive",
  "wrist_sensitive",
];

export const STYLE_OPTIONS: StylePreference[] = [
  "steady",
  "interval",
  "strength",
  "flow",
];

export const ENERGY_OPTIONS: EnergyLevel[] = ["low", "medium", "high"];

export const DEFAULT_INPUTS: WorkoutInputs = {
  goal: "general_fitness",
  duration: 45,
  level: "beginner",
  equipment: ["bodyweight_only"],
  focusArea: "full_body",
  impactTolerance: "low",
  physicalLimitations: [],
  energy: "medium",
  stylePreference: "steady",
  simpleMode: true,
};

export const HOME_SAFE_EQUIPMENT: EquipmentType[] = [
  "bodyweight",
  "dumbbell",
  "kettlebell",
  "band",
  "trx",
  "bench_or_box",
];

export const LIGHT_EQUIPMENT_SET = new Set<EquipmentType>([
  "bodyweight",
  "dumbbell",
  "kettlebell",
  "band",
  "trx",
  "bench_or_box",
]);

export const GOAL_LABELS: Record<Goal, string> = {
  general_fitness: "General Fitness",
  strength: "Strength",
  tone: "Tone",
  fat_burn: "Fat Burn",
  conditioning: "Conditioning",
  mobility: "Mobility",
  core: "Core",
  low_impact: "Low Impact",
};

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: "Beginner",
  lower_intermediate: "Lower Intermediate",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const EQUIPMENT_LABELS: Record<EquipmentOption, string> = {
  bodyweight_only: "Bodyweight only",
  dumbbell: "Dumbbell",
  kettlebell: "Kettlebell",
  band: "Band",
  trx: "TRX",
  bench_or_box: "Bench / Box",
  mixed_light_equipment: "Mixed light kit",
};

export const FOCUS_LABELS: Record<FocusArea, string> = {
  full_body: "Full Body",
  lower_body: "Lower Body",
  upper_body: "Upper Body",
  core: "Core",
};

export const IMPACT_LABELS: Record<ImpactTolerance, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const LIMITATION_LABELS: Record<PhysicalLimitation, string> = {
  knee_sensitive: "Knee sensitive",
  lower_back_sensitive: "Lower-back sensitive",
  shoulder_sensitive: "Shoulder sensitive",
  wrist_sensitive: "Wrist sensitive",
};

export const STYLE_LABELS: Record<StylePreference, string> = {
  steady: "Steady",
  interval: "Interval",
  strength: "Strength",
  flow: "Flow",
};

export const ENERGY_LABELS: Record<EnergyLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const ROLE_LABELS: Record<SessionRole, string> = {
  warmup: "Warm-up",
  activation: "Activation",
  main: "Main Block",
  accessory: "Accessory / Core",
  finisher: "Finisher",
  cooldown: "Cooldown",
};

export const BODY_REGION_LABELS: Record<BodyRegion, string> = {
  full_body: "Full Body",
  lower_body: "Lower Body",
  upper_body: "Upper Body",
  core: "Core",
};

export const INTENSITY_LABELS: Record<IntensityEstimate, string> = {
  low: "Low",
  low_medium: "Low-Medium",
  medium: "Medium",
  medium_high: "Medium-High",
  high: "High",
};

const LIGHT_EQUIPMENT_GROUP: EquipmentType[] = [
  "bodyweight",
  "dumbbell",
  "kettlebell",
  "band",
  "trx",
  "bench_or_box",
];

export function resolveAllowedEquipment(
  equipment: EquipmentOption[],
): Set<EquipmentType> {
  const selected = equipment.length > 0 ? equipment : ["bodyweight_only"];
  const allowed = new Set<EquipmentType>(["bodyweight"]);

  if (selected.includes("mixed_light_equipment")) {
    LIGHT_EQUIPMENT_GROUP.forEach((item) => allowed.add(item));
  }

  for (const option of selected) {
    switch (option) {
      case "bodyweight_only":
        break;
      case "dumbbell":
      case "kettlebell":
      case "band":
      case "trx":
      case "bench_or_box":
        allowed.add(option);
        break;
      case "mixed_light_equipment":
        break;
    }
  }

  return allowed;
}

export function formatTitleCase(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getImpactRank(level: ImpactTolerance): number {
  return { low: 1, medium: 2, high: 3 }[level];
}

export function getComplexityRank(level: "basic" | "moderate" | "complex"): number {
  return { basic: 1, moderate: 2, complex: 3 }[level];
}

export function getLevelRank(level: Level): number {
  return {
    beginner: 1,
    lower_intermediate: 2,
    intermediate: 3,
    advanced: 4,
  }[level];
}

export function summarizeEquipment(equipment: EquipmentType[]): string {
  if (equipment.length === 0) {
    return "Bodyweight";
  }

  return equipment
    .map((item) => item.replaceAll("_", " "))
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(", ");
}
