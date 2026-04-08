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

export type ContentKind = "exercise" | "tutorial";
export type PrescriptionFormat = "reps" | "time" | "hold";
export type AssetKind = "exercise_single" | "followalong_sequence";
export type BuilderStatus = "include" | "manual_review" | "exclude";
export type BalanceBucket =
  | "lower_knee"
  | "lower_hip"
  | "upper_push"
  | "upper_pull"
  | "trunk"
  | "total_body"
  | "mobility_recovery";
export type MovementFamilyDetailed =
  | "squat_bilateral"
  | "squat_supported"
  | "lunge_forward_reverse"
  | "lunge_lateral"
  | "split_squat"
  | "step_up"
  | "hinge_bilateral"
  | "hinge_single_leg"
  | "glute_bridge"
  | "hamstring_curl"
  | "calf_raise"
  | "upper_push_horizontal"
  | "upper_push_vertical"
  | "upper_pull_horizontal"
  | "upper_pull_vertical"
  | "scapular_control"
  | "carry_hold"
  | "core_anti_extension"
  | "core_anti_rotation"
  | "core_anti_lateral_flexion"
  | "core_flexion"
  | "core_rotation"
  | "cross_crawl_pattern"
  | "hip_mobility"
  | "tspine_mobility"
  | "shoulder_mobility"
  | "ankle_mobility"
  | "breathing_reset"
  | "low_impact_conditioning"
  | "jump_plyometric"
  | "ballistic_power"
  | "mixed_other";
export type SlotDetail =
  | "warmup_mobility"
  | "activation_glute"
  | "activation_core"
  | "activation_scapula"
  | "main_strength"
  | "accessory_strength"
  | "power"
  | "conditioning"
  | "skill"
  | "cooldown_breathing"
  | "cooldown_mobility"
  | "cooldown_downregulation";
export type PositionDetail =
  | "standing"
  | "staggered_stance"
  | "split_stance"
  | "half_kneeling"
  | "tall_kneeling"
  | "quadruped"
  | "supine"
  | "prone"
  | "side_lying"
  | "seated"
  | "plank"
  | "hanging"
  | "bench_supported"
  | "wall_supported";
export type ContractionStyle =
  | "dynamic_reps"
  | "isometric_hold"
  | "ballistic"
  | "cyclical_endurance"
  | "controlled_mobility";
export type PlaneOfMotion = "sagittal" | "frontal" | "transverse" | "multiplanar";
export type EnvironmentAccess =
  | "home_open"
  | "bench_or_box_needed"
  | "anchor_or_rig_needed"
  | "hanging_rig_needed"
  | "wall_needed"
  | "commercial_gym_preferred"
  | "band_anchor_needed";
export type TechnicalGate =
  | "standard"
  | "overhead"
  | "hanging"
  | "inversion"
  | "ballistic"
  | "complex_skill";
export type LimbPattern =
  | "bilateral"
  | "unilateral"
  | "alternating"
  | "offset_loaded"
  | "contralateral";
export type MovementClass =
  | "mobility"
  | "compound"
  | "accessory"
  | "isolation"
  | "conditioning"
  | "power"
  | "recovery";
export type VariationTier = "regression" | "standard" | "progression" | "specialist";
export type PrescriptionProfile =
  | "mobility_prep"
  | "compound_strength"
  | "accessory_volume"
  | "isolation_volume"
  | "core_control"
  | "conditioning_interval"
  | "power_output"
  | "recovery_reset";

export type BuilderTag =
  | "prep_upper"
  | "prep_lower"
  | "prep_core"
  | "prep_full"
  | "activation_upper"
  | "activation_lower"
  | "activation_core"
  | "activation_full"
  | "strength_upper_push"
  | "strength_upper_pull"
  | "strength_lower_squat"
  | "strength_lower_hinge"
  | "strength_lower_lunge"
  | "strength_core"
  | "accessory_upper"
  | "accessory_lower"
  | "accessory_core"
  | "recovery_upper"
  | "recovery_lower"
  | "recovery_core"
  | "recovery_breathing"
  | "mobility_thoracic"
  | "mobility_hips"
  | "scapular_control"
  | "anti_rotation"
  | "push_pattern"
  | "pull_pattern"
  | "squat_pattern"
  | "hinge_pattern"
  | "lunge_pattern";

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
  contentKind: ContentKind;
  assetKind: AssetKind;
  builderStatus: BuilderStatus;
  exerciseFamily: string;
  movementFamilyDetailed: MovementFamilyDetailed;
  builderTags: BuilderTag[];
  balanceBucket: BalanceBucket;
  slotDetails: SlotDetail[];
  preferredFormat: PrescriptionFormat;
  equipmentTypes: EquipmentType[];
  primaryPattern: PrimaryPattern;
  secondaryPattern: PrimaryPattern | null;
  bodyRegion: BodyRegion;
  impactLevel: ImpactTolerance;
  complexityLevel: ComplexityLevel;
  intensityEstimate: IntensityEstimate;
  unilateral: boolean;
  positionType: PositionType;
  positionDetail: PositionDetail;
  contractionStyle: ContractionStyle;
  planeOfMotion: PlaneOfMotion;
  environmentAccess: EnvironmentAccess;
  technicalGates: TechnicalGate[];
  limbPattern: LimbPattern;
  movementClass: MovementClass;
  variationTier: VariationTier;
  prescriptionProfile: PrescriptionProfile;
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
  format: PrescriptionFormat;
  rounds: number;
  summary: string;
  estimatedSeconds: number;
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
  estimatedTotalMinutes?: number;
}

export interface GeneratedSession {
  language: AppLanguage;
  generatedAtIso: string;
  title: string;
  summaryText: string;
  totalDuration: DurationMinutes;
  inputs: WorkoutInputs;
  safetyNotes: string[];
  blocks: SessionBlock[];
  summary: SessionSummary;
  diagnostics: SessionDiagnostics;
}
