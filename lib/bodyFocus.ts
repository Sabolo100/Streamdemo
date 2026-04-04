import type {
  AnatomyZone,
  AppLanguage,
  BodyRegion,
  PrimaryPattern,
  VideoItem,
} from "@/types/workout";

type AnatomyView = "front" | "back";

interface ZoneDefinition {
  zone: AnatomyZone;
  view: AnatomyView;
}

export interface ExerciseFocusZone {
  zone: AnatomyZone;
  view: AnatomyView;
  label: string;
  weight: number;
  intensity: number;
}

export interface ExerciseFocusProfile {
  title: string;
  summary: string;
  frontZones: ExerciseFocusZone[];
  backZones: ExerciseFocusZone[];
  legendZones: ExerciseFocusZone[];
}

const FRONT_ZONE_ORDER: AnatomyZone[] = [
  "shoulders_front",
  "arms_front",
  "chest",
  "core_front",
  "hips_front",
  "quads",
];

const BACK_ZONE_ORDER: AnatomyZone[] = [
  "shoulders_back",
  "arms_back",
  "upper_back",
  "lower_back",
  "glutes",
  "hamstrings_calves",
];

const ALL_ZONES: ZoneDefinition[] = [
  ...FRONT_ZONE_ORDER.map((zone) => ({ zone, view: "front" as const })),
  ...BACK_ZONE_ORDER.map((zone) => ({ zone, view: "back" as const })),
];

const LABELS: Record<AppLanguage, Record<AnatomyZone, string>> = {
  en: {
    shoulders_front: "Front shoulders",
    arms_front: "Arms",
    chest: "Chest",
    core_front: "Core",
    hips_front: "Hip flexors / hips",
    quads: "Quads",
    shoulders_back: "Rear shoulders",
    arms_back: "Arms",
    upper_back: "Upper back",
    lower_back: "Lower back",
    glutes: "Glutes",
    hamstrings_calves: "Hamstrings / calves",
  },
  hu: {
    shoulders_front: "Első váll",
    arms_front: "Karok",
    chest: "Mellkas",
    core_front: "Törzs",
    hips_front: "Csípőhajlítók / csípő",
    quads: "Combfeszítők",
    shoulders_back: "Hátsó váll",
    arms_back: "Karok",
    upper_back: "Felső hát",
    lower_back: "Derék",
    glutes: "Farizom",
    hamstrings_calves: "Combhajlítók / vádli",
  },
};

const PANEL_TITLES: Record<AppLanguage, string> = {
  en: "Body Focus",
  hu: "Testfókusz",
};

const VIEW_LABELS: Record<AppLanguage, Record<AnatomyView, string>> = {
  en: { front: "Front", back: "Back" },
  hu: { front: "Elöl", back: "Hátul" },
};

export function getExerciseFocusProfile(
  video: VideoItem,
  language: AppLanguage,
): ExerciseFocusProfile {
  const weights = initializeWeights();

  applyRegionWeights(weights, video.bodyRegion);
  applyPatternWeights(weights, video.primaryPattern, video.bodyRegion);

  const ranked = ALL_ZONES.map(({ zone, view }) => ({
    zone,
    view,
    weight: weights[zone],
    label: LABELS[language][zone],
  }))
    .filter((entry) => entry.weight > 0)
    .sort((left, right) => {
      if (right.weight !== left.weight) {
        return right.weight - left.weight;
      }

      return zoneIndex(left.zone) - zoneIndex(right.zone);
    });

  if (ranked.length === 0) {
    const fallback = buildZone(language, "core_front", "front", 1, 1);
    return {
      title: PANEL_TITLES[language],
      summary: fallback.label,
      frontZones: [fallback],
      backZones: [],
      legendZones: [fallback],
    };
  }

  const maxWeight = ranked[0].weight;
  const normalized = ranked.map((entry) =>
    buildZone(
      language,
      entry.zone,
      entry.view,
      entry.weight,
      normalizeIntensity(entry.weight, maxWeight),
    ),
  );

  return {
    title: PANEL_TITLES[language],
    summary: normalized
      .slice(0, 3)
      .map((entry) => entry.label)
      .join(language === "hu" ? " • " : " • "),
    frontZones: normalized.filter((entry) => entry.view === "front"),
    backZones: normalized.filter((entry) => entry.view === "back"),
    legendZones: normalized.slice(0, 3),
  };
}

export function getViewLabel(language: AppLanguage, view: AnatomyView): string {
  return VIEW_LABELS[language][view];
}

function buildZone(
  language: AppLanguage,
  zone: AnatomyZone,
  view: AnatomyView,
  weight: number,
  intensity: number,
): ExerciseFocusZone {
  return {
    zone,
    view,
    weight,
    intensity,
    label: LABELS[language][zone],
  };
}

function zoneIndex(zone: AnatomyZone): number {
  return [...FRONT_ZONE_ORDER, ...BACK_ZONE_ORDER].indexOf(zone);
}

function initializeWeights(): Record<AnatomyZone, number> {
  return {
    shoulders_front: 0,
    arms_front: 0,
    chest: 0,
    core_front: 0,
    hips_front: 0,
    quads: 0,
    shoulders_back: 0,
    arms_back: 0,
    upper_back: 0,
    lower_back: 0,
    glutes: 0,
    hamstrings_calves: 0,
  };
}

function addWeight(
  weights: Record<AnatomyZone, number>,
  zone: AnatomyZone,
  amount: number,
) {
  weights[zone] += amount;
}

function applyRegionWeights(
  weights: Record<AnatomyZone, number>,
  region: BodyRegion,
) {
  switch (region) {
    case "upper_body":
      addWeight(weights, "shoulders_front", 0.55);
      addWeight(weights, "arms_front", 0.35);
      addWeight(weights, "chest", 0.75);
      addWeight(weights, "shoulders_back", 0.55);
      addWeight(weights, "arms_back", 0.35);
      addWeight(weights, "upper_back", 0.8);
      break;
    case "lower_body":
      addWeight(weights, "hips_front", 0.45);
      addWeight(weights, "quads", 0.95);
      addWeight(weights, "glutes", 0.8);
      addWeight(weights, "hamstrings_calves", 0.8);
      break;
    case "core":
      addWeight(weights, "core_front", 1);
      addWeight(weights, "lower_back", 0.55);
      addWeight(weights, "hips_front", 0.25);
      break;
    case "full_body":
    default:
      addWeight(weights, "shoulders_front", 0.3);
      addWeight(weights, "arms_front", 0.25);
      addWeight(weights, "chest", 0.35);
      addWeight(weights, "core_front", 0.5);
      addWeight(weights, "hips_front", 0.3);
      addWeight(weights, "quads", 0.45);
      addWeight(weights, "shoulders_back", 0.3);
      addWeight(weights, "arms_back", 0.25);
      addWeight(weights, "upper_back", 0.35);
      addWeight(weights, "lower_back", 0.3);
      addWeight(weights, "glutes", 0.45);
      addWeight(weights, "hamstrings_calves", 0.45);
      break;
  }
}

function applyPatternWeights(
  weights: Record<AnatomyZone, number>,
  pattern: PrimaryPattern,
  region: BodyRegion,
) {
  switch (pattern) {
    case "push":
      addWeight(weights, "shoulders_front", 1.25);
      addWeight(weights, "arms_front", 1.15);
      addWeight(weights, "chest", 1.35);
      addWeight(weights, "core_front", 0.35);
      addWeight(weights, "shoulders_back", 0.25);
      break;
    case "pull":
      addWeight(weights, "shoulders_back", 1.1);
      addWeight(weights, "arms_back", 1.2);
      addWeight(weights, "upper_back", 1.45);
      addWeight(weights, "core_front", 0.2);
      break;
    case "squat":
      addWeight(weights, "quads", 1.5);
      addWeight(weights, "hips_front", 0.75);
      addWeight(weights, "glutes", 0.95);
      addWeight(weights, "core_front", 0.35);
      addWeight(weights, "hamstrings_calves", 0.45);
      break;
    case "lunge":
      addWeight(weights, "quads", 1.25);
      addWeight(weights, "hips_front", 0.55);
      addWeight(weights, "glutes", 1.05);
      addWeight(weights, "hamstrings_calves", 0.65);
      addWeight(weights, "core_front", 0.3);
      break;
    case "hinge":
      addWeight(weights, "glutes", 1.45);
      addWeight(weights, "hamstrings_calves", 1.25);
      addWeight(weights, "lower_back", 0.85);
      addWeight(weights, "core_front", 0.6);
      if (region !== "lower_body") {
        addWeight(weights, "upper_back", 0.3);
      }
      break;
    case "core":
      addWeight(weights, "core_front", 1.7);
      addWeight(weights, "lower_back", 0.7);
      addWeight(weights, "hips_front", 0.25);
      break;
    case "cardio_locomotion":
      addWeight(weights, "quads", 1.15);
      addWeight(weights, "hamstrings_calves", 1);
      addWeight(weights, "core_front", 0.55);
      addWeight(weights, "arms_front", 0.25);
      addWeight(weights, "glutes", 0.45);
      break;
    case "balance_stability":
      addWeight(weights, "core_front", 0.95);
      addWeight(weights, "lower_back", 0.45);
      addWeight(weights, "glutes", 0.7);
      addWeight(weights, "quads", 0.3);
      break;
    case "mobility":
      applyMobilityPattern(weights, region);
      break;
    case "mixed_other":
    default:
      addWeight(weights, "core_front", 0.2);
      break;
  }
}

function applyMobilityPattern(
  weights: Record<AnatomyZone, number>,
  region: BodyRegion,
) {
  switch (region) {
    case "upper_body":
      addWeight(weights, "shoulders_front", 0.55);
      addWeight(weights, "shoulders_back", 0.55);
      addWeight(weights, "chest", 0.4);
      addWeight(weights, "upper_back", 0.5);
      break;
    case "lower_body":
      addWeight(weights, "hips_front", 0.8);
      addWeight(weights, "glutes", 0.6);
      addWeight(weights, "hamstrings_calves", 0.7);
      addWeight(weights, "quads", 0.55);
      break;
    case "core":
      addWeight(weights, "core_front", 0.95);
      addWeight(weights, "lower_back", 0.6);
      break;
    case "full_body":
    default:
      addWeight(weights, "core_front", 0.45);
      addWeight(weights, "hips_front", 0.35);
      addWeight(weights, "upper_back", 0.3);
      addWeight(weights, "glutes", 0.3);
      break;
  }
}

function normalizeIntensity(weight: number, maxWeight: number): number {
  if (maxWeight <= 0) {
    return 0.45;
  }

  return Math.min(1, 0.32 + (weight / maxWeight) * 0.56);
}
