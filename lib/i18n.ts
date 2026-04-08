import { formatTitleCase } from "@/lib/taxonomy";
import type {
  AppLanguage,
  BodyRegion,
  ComplexityLevel,
  EnergyLevel,
  EquipmentOption,
  EquipmentType,
  FocusArea,
  Goal,
  ImpactTolerance,
  IntensityEstimate,
  Level,
  PhysicalLimitation,
  PositionType,
  PrimaryPattern,
  SessionRole,
  StylePreference,
  VideoItem,
} from "@/types/workout";

type LabelMap<K extends string> = Record<K, string>;

interface UiCopy {
  appKicker: string;
  heroTitle: string;
  heroDescription: string;
  videosLoaded: (count: number) => string;
  futureReadyRepo: string;
  language: string;
  inputs: string;
  sessionSetup: string;
  simpleModeOn: string;
  fullFlow: string;
  primaryGoal: string;
  duration: string;
  level: string;
  equipmentAvailable: string;
  focusArea: string;
  impactTolerance: string;
  physicalLimitations: string;
  physicalLimitationsHelper: string;
  energyToday: string;
  stylePreference: string;
  simpleMode: string;
  simpleModeHelper: string;
  bodyFocusCard: string;
  bodyFocusCardHelper: string;
  generateWorkout: string;
  building: string;
  regenerateSession: string;
  clearExcludedExercises: (count: number) => string;
  single: string;
  multi: string;
  generatedSession: string;
  generatedAt: string;
  noSessionTitle: string;
  noSessionDescription: string;
  hideWhySelected: string;
  showWhySelected: string;
  copied: string;
  copyFailed: string;
  copySession: string;
  cumulativeTime: string;
  profile: string;
  style: string;
  equipment: string;
  safetyNotes: string;
  prescription: string;
  whySelected: string;
  pattern: string;
  impact: string;
  openSourceVideo: string;
  excludeAndRebuild: string;
}

const GOAL_LABELS: Record<AppLanguage, LabelMap<Goal>> = {
  en: {
    general_fitness: "General Fitness",
    strength: "Strength",
    tone: "Tone",
    fat_burn: "Fat Burn",
    conditioning: "Conditioning",
    mobility: "Mobility",
    core: "Core",
    low_impact: "Low Impact",
  },
  hu: {
    general_fitness: "\u00c1ltal\u00e1nos fitnesz",
    strength: "Er\u0151",
    tone: "Form\u00e1l\u00e1s",
    fat_burn: "Zs\u00edr\u00e9get\u00e9s",
    conditioning: "\u00c1ll\u00f3k\u00e9pess\u00e9g",
    mobility: "Mobilit\u00e1s",
    core: "Core",
    low_impact: "Alacsony terhel\u00e9s",
  },
};

const LEVEL_LABELS: Record<AppLanguage, LabelMap<Level>> = {
  en: {
    beginner: "Beginner",
    lower_intermediate: "Lower Intermediate",
    intermediate: "Intermediate",
    advanced: "Advanced",
  },
  hu: {
    beginner: "Kezd\u0151",
    lower_intermediate: "Kezd\u0151-halad\u00f3",
    intermediate: "Halad\u00f3",
    advanced: "Profi",
  },
};

const EQUIPMENT_OPTION_LABELS: Record<AppLanguage, LabelMap<EquipmentOption>> = {
  en: {
    bodyweight_only: "Bodyweight only",
    dumbbell: "Dumbbell",
    kettlebell: "Kettlebell",
    band: "Band",
    trx: "TRX",
    bench_or_box: "Bench / Box",
    mixed_light_equipment: "Mixed light kit",
  },
  hu: {
    bodyweight_only: "Saj\u00e1t tests\u00faly",
    dumbbell: "K\u00e9zis\u00falyz\u00f3",
    kettlebell: "Kettlebell",
    band: "Szalag",
    trx: "TRX",
    bench_or_box: "Pad / Doboz",
    mixed_light_equipment: "Vegyes k\u00f6nny\u0171 eszk\u00f6z\u00f6k",
  },
};

const FOCUS_LABELS: Record<AppLanguage, LabelMap<FocusArea>> = {
  en: {
    full_body: "Full Body",
    lower_body: "Lower Body",
    upper_body: "Upper Body",
    core: "Core",
  },
  hu: {
    full_body: "Teljes test",
    lower_body: "Als\u00f3 test",
    upper_body: "Fels\u0151 test",
    core: "Core",
  },
};

const IMPACT_LABELS: Record<AppLanguage, LabelMap<ImpactTolerance>> = {
  en: { low: "Low", medium: "Medium", high: "High" },
  hu: { low: "Alacsony", medium: "K\u00f6zepes", high: "Magas" },
};

const LIMITATION_LABELS: Record<AppLanguage, LabelMap<PhysicalLimitation>> = {
  en: {
    knee_sensitive: "Knee sensitive",
    lower_back_sensitive: "Lower-back sensitive",
    shoulder_sensitive: "Shoulder sensitive",
    wrist_sensitive: "Wrist sensitive",
  },
  hu: {
    knee_sensitive: "\u00c9rz\u00e9keny t\u00e9rd",
    lower_back_sensitive: "\u00c9rz\u00e9keny der\u00e9k",
    shoulder_sensitive: "\u00c9rz\u00e9keny v\u00e1ll",
    wrist_sensitive: "\u00c9rz\u00e9keny csukl\u00f3",
  },
};

const STYLE_LABELS: Record<AppLanguage, LabelMap<StylePreference>> = {
  en: {
    steady: "Steady",
    interval: "Interval",
    strength: "Strength",
    flow: "Flow",
  },
  hu: {
    steady: "Egyenletes",
    interval: "Intervall",
    strength: "Er\u0151",
    flow: "Folyamatos",
  },
};

const ENERGY_LABELS: Record<AppLanguage, LabelMap<EnergyLevel>> = {
  en: { low: "Low", medium: "Medium", high: "High" },
  hu: { low: "Alacsony", medium: "K\u00f6zepes", high: "Magas" },
};

const ROLE_LABELS: Record<AppLanguage, LabelMap<SessionRole>> = {
  en: {
    warmup: "Warm-up",
    activation: "Activation",
    main: "Main Block",
    accessory: "Accessory / Core",
    finisher: "Finisher",
    cooldown: "Cooldown",
  },
  hu: {
    warmup: "Bemeleg\u00edt\u00e9s",
    activation: "Aktiv\u00e1l\u00e1s",
    main: "F\u0151 blokk",
    accessory: "Kieg\u00e9sz\u00edt\u0151 / Core",
    finisher: "Lez\u00e1r\u00e1s",
    cooldown: "Levezet\u00e9s",
  },
};

const EQUIPMENT_TYPE_LABELS: Record<AppLanguage, LabelMap<EquipmentType>> = {
  en: {
    bodyweight: "Bodyweight",
    dumbbell: "Dumbbell",
    kettlebell: "Kettlebell",
    band: "Band",
    trx: "TRX",
    bench_or_box: "Bench / Box",
    sandbag: "Sandbag",
    barbell: "Barbell",
    medball: "Medicine Ball",
    ring: "Ring",
    bosu: "BOSU",
    rope: "Rope",
    weighted_vest: "Weighted Vest",
    other: "Other",
  },
  hu: {
    bodyweight: "Saj\u00e1t tests\u00faly",
    dumbbell: "K\u00e9zis\u00falyz\u00f3",
    kettlebell: "Kettlebell",
    band: "Szalag",
    trx: "TRX",
    bench_or_box: "Pad / Doboz",
    sandbag: "Homokzs\u00e1k",
    barbell: "R\u00fad",
    medball: "Medicinlabda",
    ring: "Gy\u0171r\u0171",
    bosu: "BOSU",
    rope: "K\u00f6t\u00e9l",
    weighted_vest: "S\u00falymell\u00e9ny",
    other: "Egy\u00e9b",
  },
};

const PATTERN_LABELS: Record<AppLanguage, LabelMap<PrimaryPattern>> = {
  en: {
    squat: "Squat",
    lunge: "Lunge",
    hinge: "Hinge",
    push: "Push",
    pull: "Pull",
    core: "Core",
    mobility: "Mobility",
    cardio_locomotion: "Cardio",
    balance_stability: "Balance",
    mixed_other: "Mixed",
  },
  hu: {
    squat: "Guggol\u00e1s",
    lunge: "Kit\u00f6r\u00e9s",
    hinge: "Cs\u00edp\u0151hajl\u00edt\u00e1s",
    push: "Tol\u00e1s",
    pull: "H\u00faz\u00e1s",
    core: "Core",
    mobility: "Mobilit\u00e1s",
    cardio_locomotion: "Kardi\u00f3",
    balance_stability: "Egyens\u00faly",
    mixed_other: "Vegyes",
  },
};

const BODY_REGION_LABELS: Record<AppLanguage, LabelMap<BodyRegion>> = {
  en: {
    full_body: "Full Body",
    lower_body: "Lower Body",
    upper_body: "Upper Body",
    core: "Core",
  },
  hu: {
    full_body: "Teljes test",
    lower_body: "Als\u00f3 test",
    upper_body: "Fels\u0151 test",
    core: "Core",
  },
};

const INTENSITY_LABELS: Record<AppLanguage, LabelMap<IntensityEstimate>> = {
  en: {
    low: "Low",
    low_medium: "Low-Medium",
    medium: "Medium",
    medium_high: "Medium-High",
    high: "High",
  },
  hu: {
    low: "Alacsony",
    low_medium: "Alacsony-k\u00f6zepes",
    medium: "K\u00f6zepes",
    medium_high: "K\u00f6zepesen magas",
    high: "Magas",
  },
};

const POSITION_LABELS: Record<AppLanguage, LabelMap<PositionType>> = {
  en: { standing: "Standing", floor: "Floor", mixed: "Mixed" },
  hu: { standing: "\u00c1ll\u00f3", floor: "Talaj", mixed: "Vegyes" },
};

const COMPLEXITY_LABELS: Record<AppLanguage, LabelMap<ComplexityLevel>> = {
  en: { basic: "Basic", moderate: "Moderate", complex: "Complex" },
  hu: { basic: "Alap", moderate: "K\u00f6zepes", complex: "\u00d6sszetett" },
};

const UI_COPY: Record<AppLanguage, UiCopy> = {
  en: {
    appKicker: "Streamfit MVP",
    heroTitle: "Deterministic workout sessions from a tagged video library.",
    heroDescription:
      "One-screen session builder for safe, home-appropriate workouts. The left panel captures intent and constraints, while the right panel assembles a structured session block by block.",
    videosLoaded: (count) => `${count} normalized videos loaded`,
    futureReadyRepo: "Future-ready local repository layer for Supabase swap",
    language: "Language",
    inputs: "Inputs",
    sessionSetup: "Session setup",
    simpleModeOn: "Simple mode on",
    fullFlow: "Full flow",
    primaryGoal: "Primary goal",
    duration: "Duration",
    level: "Level",
    equipmentAvailable: "Equipment available",
    focusArea: "Focus area",
    impactTolerance: "Impact tolerance",
    physicalLimitations: "Physical limitations",
    physicalLimitationsHelper: "Leave all off if there are no special limitations to respect.",
    energyToday: "Energy today",
    stylePreference: "Style preference",
    simpleMode: "Simple mode",
    simpleModeHelper: "Fewer transitions, fewer exercises, cleaner beginner flow.",
    bodyFocusCard: "Body focus card",
    bodyFocusCardHelper: "Show or hide the exercise-level front/back body focus preview.",
    generateWorkout: "Generate workout",
    building: "Building...",
    regenerateSession: "Regenerate session",
    clearExcludedExercises: (count) =>
      `Clear ${count} excluded exercise${count > 1 ? "s" : ""}`,
    single: "Single",
    multi: "Multi",
    generatedSession: "Generated Session",
    generatedAt: "Generated at",
    noSessionTitle: "No training plan yet",
    noSessionDescription:
      "Set the inputs above, then generate a workout. The plan will appear here after the first generation.",
    hideWhySelected: "Hide why selected",
    showWhySelected: "Show why selected",
    copied: "Copied",
    copyFailed: "Copy failed",
    copySession: "Copy session",
    cumulativeTime: "Cumulative time",
    profile: "Profile",
    style: "Style",
    equipment: "Equipment",
    safetyNotes: "Safety notes",
    prescription: "Prescription",
    whySelected: "Why selected",
    pattern: "Pattern",
    impact: "Impact",
    openSourceVideo: "Open source video",
    excludeAndRebuild: "Exclude from next generation",
  },
  hu: {
    appKicker: "Streamfit MVP",
    heroTitle: "Determinista edz\u00e9sterv a c\u00edmk\u00e9zett vide\u00f3t\u00e1r alapj\u00e1n.",
    heroDescription:
      "Egyk\u00e9perny\u0151s session builder biztons\u00e1gos, otthon is v\u00e9gezhet\u0151 edz\u00e9sekhez. Bal oldalon az ig\u00e9nyek \u00e9s korl\u00e1tok, jobb oldalon a struktur\u00e1lt edz\u00e9sblokk jelenik meg.",
    videosLoaded: (count) => `${count} normaliz\u00e1lt vide\u00f3 bet\u00f6ltve`,
    futureReadyRepo: "Supabase-re k\u00e9s\u0151bb k\u00f6nnyen cser\u00e9lhet\u0151 adatt\u00e1r r\u00e9teg",
    language: "Nyelv",
    inputs: "Bemenetek",
    sessionSetup: "Session be\u00e1ll\u00edt\u00e1s",
    simpleModeOn: "Egyszer\u0171 m\u00f3d",
    fullFlow: "Teljes flow",
    primaryGoal: "F\u0151 c\u00e9l",
    duration: "Id\u0151tartam",
    level: "Szint",
    equipmentAvailable: "El\u00e9rhet\u0151 eszk\u00f6z\u00f6k",
    focusArea: "F\u00f3kuszter\u00fclet",
    impactTolerance: "Terhel\u00e9si tolerancia",
    physicalLimitations: "Fizikai korl\u00e1toz\u00e1sok",
    physicalLimitationsHelper: "Ha nincs k\u00fcl\u00f6n korl\u00e1toz\u00e1s, hagyd mindet kikapcsolva.",
    energyToday: "Mai energiaszint",
    stylePreference: "St\u00edluspreferencia",
    simpleMode: "Egyszer\u0171 m\u00f3d",
    simpleModeHelper: "Kevesebb \u00e1tmenet, kevesebb gyakorlat, tiszt\u00e1bb kezd\u0151 flow.",
    bodyFocusCard: "Testf\u00f3kusz k\u00e1rtya",
    bodyFocusCardHelper: "Feladatonk\u00e9nt jelenjen meg vagy rejt\u0151zz\u00f6n el az el\u00f6l/h\u00e1tul testf\u00f3kusz n\u00e9zet.",
    generateWorkout: "Edz\u00e9s gener\u00e1l\u00e1sa",
    building: "\u00c9p\u00edtj\u00fck...",
    regenerateSession: "\u00dajragener\u00e1l\u00e1s",
    clearExcludedExercises: (count) => `${count} kiz\u00e1rt gyakorlat t\u00f6rl\u00e9se`,
    single: "Egy",
    multi: "T\u00f6bb",
    generatedSession: "Gener\u00e1lt session",
    generatedAt: "Gener\u00e1l\u00e1s id\u0151pontja",
    noSessionTitle: "M\u00e9g nincs edz\u00e9sterv",
    noSessionDescription:
      "\u00c1ll\u00edtsd be fent a param\u00e9tereket, majd gener\u00e1lj edz\u00e9st. Az els\u0151 gener\u00e1l\u00e1s ut\u00e1n itt jelenik meg a terv.",
    hideWhySelected: "Indokl\u00e1s elrejt\u00e9se",
    showWhySelected: "Indokl\u00e1s megjelen\u00edt\u00e9se",
    copied: "M\u00e1solva",
    copyFailed: "M\u00e1sol\u00e1s sikertelen",
    copySession: "Session m\u00e1sol\u00e1sa",
    cumulativeTime: "Kumul\u00e1lt id\u0151",
    profile: "Profil",
    style: "St\u00edlus",
    equipment: "Eszk\u00f6z\u00f6k",
    safetyNotes: "Biztons\u00e1gi megjegyz\u00e9sek",
    prescription: "El\u0151\u00edr\u00e1s",
    whySelected: "Mi\u00e9rt ezt v\u00e1lasztottuk",
    pattern: "Minta",
    impact: "Terhel\u00e9s",
    openSourceVideo: "Forr\u00e1svide\u00f3 megnyit\u00e1sa",
    excludeAndRebuild: "Kiz\u00e1r\u00e1s a k\u00f6vetkez\u0151 gener\u00e1l\u00e1sb\u00f3l",
  },
};

export const LANGUAGE_OPTIONS: AppLanguage[] = ["en", "hu"];
export const DEFAULT_LANGUAGE: AppLanguage = "en";

export function getUiCopy(language: AppLanguage): UiCopy {
  return UI_COPY[language];
}

export function formatElapsedClockLocalized(
  language: AppLanguage,
  totalSeconds: number,
): string {
  const normalizedSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(normalizedSeconds / 60);
  const seconds = normalizedSeconds % 60;
  const paddedSeconds = seconds.toString().padStart(2, "0");

  if (language === "hu") {
    return `${minutes}:${paddedSeconds}`;
  }

  return `${minutes}:${paddedSeconds}`;
}

export function formatGeneratedAtLocalized(
  language: AppLanguage,
  generatedAtIso: string,
): string {
  const date = new Date(generatedAtIso);

  return new Intl.DateTimeFormat(language === "hu" ? "hu-HU" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getLanguageLabel(language: AppLanguage): string {
  return language === "en" ? "English" : "Magyar";
}

export function getGoalLabel(language: AppLanguage, goal: Goal): string {
  return GOAL_LABELS[language][goal];
}

export function getLevelLabel(language: AppLanguage, level: Level): string {
  return LEVEL_LABELS[language][level];
}

export function getEquipmentOptionLabel(
  language: AppLanguage,
  option: EquipmentOption,
): string {
  return EQUIPMENT_OPTION_LABELS[language][option];
}

export function getFocusLabel(language: AppLanguage, focus: FocusArea): string {
  return FOCUS_LABELS[language][focus];
}

export function getImpactLabel(
  language: AppLanguage,
  impact: ImpactTolerance,
): string {
  return IMPACT_LABELS[language][impact];
}

export function getLimitationLabel(
  language: AppLanguage,
  limitation: PhysicalLimitation,
): string {
  return LIMITATION_LABELS[language][limitation];
}

export function getStyleLabel(
  language: AppLanguage,
  style: StylePreference,
): string {
  return STYLE_LABELS[language][style];
}

export function getEnergyLabel(
  language: AppLanguage,
  energy: EnergyLevel,
): string {
  return ENERGY_LABELS[language][energy];
}

export function getRoleLabel(
  language: AppLanguage,
  role: SessionRole,
): string {
  return ROLE_LABELS[language][role];
}

export function getEquipmentTypeLabel(
  language: AppLanguage,
  equipment: EquipmentType,
): string {
  return EQUIPMENT_TYPE_LABELS[language][equipment];
}

export function getPatternLabel(
  language: AppLanguage,
  pattern: PrimaryPattern,
): string {
  return PATTERN_LABELS[language][pattern];
}

export function getBodyRegionLabel(
  language: AppLanguage,
  region: BodyRegion,
): string {
  return BODY_REGION_LABELS[language][region];
}

export function getIntensityLabel(
  language: AppLanguage,
  intensity: IntensityEstimate,
): string {
  return INTENSITY_LABELS[language][intensity];
}

export function getPositionLabel(
  language: AppLanguage,
  position: PositionType,
): string {
  return POSITION_LABELS[language][position];
}

export function getComplexityLabel(
  language: AppLanguage,
  complexity: ComplexityLevel,
): string {
  return COMPLEXITY_LABELS[language][complexity];
}

export function getVideoTitle(
  video: VideoItem,
  language: AppLanguage,
): string {
  if (language === "hu" && video.titleHu.trim()) {
    return video.titleHu;
  }

  return video.title;
}

export function getSecondaryVideoTitle(
  video: VideoItem,
  language: AppLanguage,
): string {
  if (language === "hu") {
    return video.title;
  }

  return video.titleHu || video.title;
}

export function summarizeEquipmentLocalized(
  language: AppLanguage,
  equipment: EquipmentType[],
): string {
  if (equipment.length === 0) {
    return getEquipmentTypeLabel(language, "bodyweight");
  }

  return equipment.map((item) => getEquipmentTypeLabel(language, item)).join(", ");
}

export function formatDurationLocalized(
  language: AppLanguage,
  minutes: number,
): string {
  return language === "hu" ? `${minutes} perc` : `${minutes} min`;
}

export function formatTagLabel(language: AppLanguage, tag: string): string {
  const normalized = tag as
    | Goal
    | FocusArea
    | ImpactTolerance
    | IntensityEstimate
    | EquipmentType
    | PrimaryPattern
    | PositionType
    | ComplexityLevel
    | BodyRegion;

  if (normalized in EQUIPMENT_TYPE_LABELS.en) {
    return getEquipmentTypeLabel(language, normalized as EquipmentType);
  }

  if (normalized in PATTERN_LABELS.en) {
    return getPatternLabel(language, normalized as PrimaryPattern);
  }

  if (normalized in BODY_REGION_LABELS.en) {
    return getBodyRegionLabel(language, normalized as BodyRegion);
  }

  if (normalized in IMPACT_LABELS.en) {
    return getImpactLabel(language, normalized as ImpactTolerance);
  }

  if (normalized in INTENSITY_LABELS.en) {
    return getIntensityLabel(language, normalized as IntensityEstimate);
  }

  if (normalized in POSITION_LABELS.en) {
    return getPositionLabel(language, normalized as PositionType);
  }

  if (normalized in COMPLEXITY_LABELS.en) {
    return getComplexityLabel(language, normalized as ComplexityLevel);
  }

  return formatTitleCase(tag);
}
