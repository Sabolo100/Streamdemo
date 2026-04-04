export type Goal =
  | "general_fitness"
  | "strength"
  | "tone"
  | "fat_burn"
  | "conditioning"
  | "mobility"
  | "core"
  | "low_impact";

export type AppLanguage = "en" | "hu";

export type DurationMinutes = 30 | 45 | 60;

export type Level =
  | "beginner"
  | "lower_intermediate"
  | "intermediate"
  | "advanced";

export type EquipmentOption =
  | "bodyweight_only"
  | "dumbbell"
  | "kettlebell"
  | "band"
  | "trx"
  | "bench_or_box"
  | "mixed_light_equipment";

export type EquipmentType =
  | "bodyweight"
  | "dumbbell"
  | "kettlebell"
  | "band"
  | "trx"
  | "bench_or_box"
  | "sandbag"
  | "barbell"
  | "medball"
  | "ring"
  | "bosu"
  | "rope"
  | "weighted_vest"
  | "other";

export type FocusArea = "full_body" | "lower_body" | "upper_body" | "core";

export type ImpactTolerance = "low" | "medium" | "high";

export type PhysicalLimitation =
  | "knee_sensitive"
  | "lower_back_sensitive"
  | "shoulder_sensitive"
  | "wrist_sensitive";

export type EnergyLevel = "low" | "medium" | "high";

export type StylePreference = "steady" | "interval" | "strength" | "flow";

export type SessionRole =
  | "warmup"
  | "activation"
  | "main"
  | "accessory"
  | "finisher"
  | "cooldown";

export type PrimaryPattern =
  | "squat"
  | "lunge"
  | "hinge"
  | "push"
  | "pull"
  | "core"
  | "mobility"
  | "cardio_locomotion"
  | "balance_stability"
  | "mixed_other";

export type BodyRegion = "lower_body" | "upper_body" | "core" | "full_body";

export type AnatomyZone =
  | "shoulders_front"
  | "arms_front"
  | "chest"
  | "core_front"
  | "hips_front"
  | "quads"
  | "shoulders_back"
  | "arms_back"
  | "upper_back"
  | "lower_back"
  | "glutes"
  | "hamstrings_calves";

export type ComplexityLevel = "basic" | "moderate" | "complex";

export type IntensityEstimate =
  | "low"
  | "low_medium"
  | "medium"
  | "medium_high"
  | "high";

export type PositionType = "standing" | "floor" | "mixed";

export type BeginnerFriendly = "yes" | "conditional" | "no";

export type ContraindicationTag =
  | "knee_caution"
  | "lower_back_caution"
  | "wrist_shoulder_caution";

export interface WorkoutInputs {
  goal: Goal;
  duration: DurationMinutes;
  level: Level;
  equipment: EquipmentOption[];
  focusArea: FocusArea;
  impactTolerance: ImpactTolerance;
  physicalLimitations: PhysicalLimitation[];
  energy: EnergyLevel;
  stylePreference: StylePreference;
  simpleMode: boolean;
}

export interface VideoItem {
  id: number;
  titleOriginal: string;
  title: string;
  titleHu: string;
  videoUrl: string;
  equipmentTypes: EquipmentType[];
  primaryPattern: PrimaryPattern;
  secondaryPattern: PrimaryPattern | null;
  bodyRegion: BodyRegion;
  impactLevel: ImpactTolerance;
  complexityLevel: ComplexityLevel;
  intensityEstimate: IntensityEstimate;
  unilateral: boolean;
  positionType: PositionType;
  sessionRoleFit: SessionRole[];
  beginnerFriendly: BeginnerFriendly;
  contraindications: ContraindicationTag[];
  homeSafe: boolean;
  requiresLargeSpace: boolean;
  requiresPartner: boolean;
  requiresGymSetup: boolean;
  advancedRisk: boolean;
  tags: string[];
}

export interface BuildSessionOptions {
  variationSeed?: number;
  excludedVideoIds?: number[];
  language?: AppLanguage;
}

export interface BlockTemplate {
  role: SessionRole;
  label: string;
  targetMinutes: number;
  optional?: boolean;
  minExercises: number;
  maxExercises: number;
}

export interface ExercisePrescription {
  format: "reps" | "time" | "hold";
  rounds: number;
  summary: string;
  reps?: string;
  workSeconds?: number;
  restSeconds?: number;
  holdSeconds?: number;
  loadGuidance?: string;
}

export interface ScoredVideoCandidate {
  video: VideoItem;
  score: number;
  whySelected: string;
}

export interface SelectedExercise {
  video: VideoItem;
  role: SessionRole;
  order: number;
  score: number;
  whySelected: string;
  prescription: ExercisePrescription;
}

export interface SessionBlock {
  role: SessionRole;
  label: string;
  targetMinutes: number;
  items: SelectedExercise[];
}

export interface SessionSummary {
  intensity: IntensityEstimate;
  impact: ImpactTolerance;
  equipmentUsed: EquipmentType[];
}

export interface SessionDiagnostics {
  candidateCount: number;
  removedByRule: Record<string, number>;
  constraintWarning?: string;
}

export interface GeneratedSession {
  language: AppLanguage;
  title: string;
  summaryText: string;
  totalDuration: DurationMinutes;
  inputs: WorkoutInputs;
  safetyNotes: string[];
  blocks: SessionBlock[];
  summary: SessionSummary;
  diagnostics: SessionDiagnostics;
}
