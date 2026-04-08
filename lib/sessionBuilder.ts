import { buildCandidatePool, filterCandidatesForRole } from "@/lib/filters";
import {
  getFocusLabel,
  getGoalLabel,
  getImpactLabel,
  getIntensityLabel,
  getLevelLabel,
} from "@/lib/i18n";
import { orderBlockExercises } from "@/lib/ordering";
import { createBlockPrescriptions } from "@/lib/prescriptions";
import { scoreVideo } from "@/lib/scoring";
import { getSessionTemplate } from "@/lib/templates";
import type {
  AppLanguage,
  BlockTemplate,
  BuilderTag,
  BuildSessionOptions,
  GeneratedSession,
  IntensityEstimate,
  ScoredVideoCandidate,
  SelectedExercise,
  VideoItem,
  WorkoutInputs,
} from "@/types/workout";

const UPPER_PUSH_TAGS: BuilderTag[] = ["strength_upper_push", "push_pattern"];
const UPPER_PULL_TAGS: BuilderTag[] = ["strength_upper_pull", "pull_pattern"];

export function buildWorkoutSession(
  inputs: WorkoutInputs,
  videos: VideoItem[],
  options: BuildSessionOptions = {},
): GeneratedSession {
  const variationSeed = options.variationSeed ?? 0;
  const language = options.language ?? "en";
  const filterResult = buildCandidatePool(videos, inputs, options.excludedVideoIds);
  const template = getSessionTemplate(inputs, language);
  const sessionSelections: SelectedExercise[] = [];
  const builtBlocks = new Map<BlockTemplate["role"], SelectedExercise[]>();
  const orderedTemplate = getSelectionOrder(template);

  for (const block of orderedTemplate) {
    const items = buildBlock(
      block,
      filterResult.candidates,
      inputs,
      sessionSelections,
      variationSeed,
      language,
    );

    if (items.length === 0 && block.optional) {
      continue;
    }

    builtBlocks.set(block.role, items);
    sessionSelections.push(...items);
  }

  const blocks = renumberBlocks(
    template.flatMap((block) => {
      const items = builtBlocks.get(block.role) ?? [];
      if (items.length === 0 && block.optional) {
        return [];
      }

      return [
        {
          role: block.role,
          label: block.label,
          targetMinutes: block.targetMinutes,
          items,
        },
      ];
    }),
  );
  const flattenedSelections = blocks.flatMap((block) => block.items);

  const summary = {
    intensity: estimateSessionIntensity(flattenedSelections),
    impact: estimateSessionImpact(flattenedSelections),
    equipmentUsed: collectEquipmentUsed(flattenedSelections),
  };

  const diagnostics = {
    candidateCount: filterResult.candidates.length,
    removedByRule: filterResult.removedByRule,
    estimatedTotalMinutes:
      Math.round(
        (flattenedSelections.reduce((total, item) => total + item.prescription.estimatedSeconds, 0) / 60) * 10,
      ) / 10,
    constraintWarning:
      filterResult.candidates.length < 45
        ? language === "hu"
          ? "A jelenlegi sz\u0171r\u0151k er\u0151sen lesz\u0171k\u00edtett\u00e9k a k\u00e9szletet, ez\u00e9rt a builder konzervat\u00edv maradt."
          : "The current filters narrowed the pool, so the builder stayed conservative."
        : undefined,
  };

  return {
    language,
    generatedAtIso: new Date().toISOString(),
    title: buildSessionTitle(inputs, language),
    summaryText: buildSessionSummary(inputs, summary.intensity, language),
    totalDuration: inputs.duration,
    inputs,
    safetyNotes: buildSafetyNotes(inputs, diagnostics.constraintWarning, language),
    blocks,
    summary,
    diagnostics,
  };
}

function buildBlock(
  block: BlockTemplate,
  candidates: VideoItem[],
  inputs: WorkoutInputs,
  sessionSelections: SelectedExercise[],
  variationSeed: number,
  language: AppLanguage,
): SelectedExercise[] {
  const scopedCandidates = getRoleScopedCandidates(candidates, block, inputs, sessionSelections);
  const ranked = scopedCandidates
    .map((video) =>
      scoreVideo(video, {
        role: block.role,
        inputs,
        language,
        sessionSelections,
        blockSelections: [],
      }),
    )
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => compareCandidates(left, right, variationSeed));

  const selected = pickTopCandidates(ranked, block, inputs, sessionSelections, language, variationSeed);
  const ordered = orderBlockExercises(selected, block.role, inputs);
  const prescriptions = createBlockPrescriptions(
    ordered.map((candidate) => candidate.video),
    block,
    inputs,
    language,
  );

  return ordered.map((candidate, index) => ({
    video: candidate.video,
    role: block.role,
    order: index + 1,
    score: candidate.score,
    whySelected: candidate.whySelected,
    prescription: prescriptions[index],
  }));
}

function getSelectionOrder(template: BlockTemplate[]): BlockTemplate[] {
  const priorities: Record<BlockTemplate["role"], number> = {
    main: 0,
    accessory: 1,
    activation: 2,
    warmup: 3,
    finisher: 4,
    cooldown: 5,
  };

  return [...template].sort((left, right) => priorities[left.role] - priorities[right.role]);
}

function renumberBlocks(
  blocks: Array<{
    role: BlockTemplate["role"];
    label: string;
    targetMinutes: number;
    items: SelectedExercise[];
  }>,
) {
  let order = 1;

  return blocks.map((block) => ({
    ...block,
    items: block.items.map((item) => ({
      ...item,
      order: order++,
    })),
  }));
}

function getRoleScopedCandidates(
  candidates: VideoItem[],
  block: BlockTemplate,
  inputs: WorkoutInputs,
  sessionSelections: SelectedExercise[],
): VideoItem[] {
  const strict = filterCandidatesForRole(candidates, block.role, inputs);
  if (strict.length >= block.minExercises) {
    return strict;
  }

  const relaxed = candidates.filter((video) => !sessionSelections.some((item) => item.video.id === video.id));
  return relaxed.filter((video) => {
    switch (block.role) {
      case "warmup":
        return (
          video.intensityEstimate !== "high" &&
          ["mobility", "recovery", "accessory"].includes(video.movementClass) &&
          video.variationTier !== "specialist" &&
          (
            hasAnyBuilderTag(video, getRelaxedWarmupTags(inputs)) ||
            (inputs.focusArea === "full_body" && video.primaryPattern === "mobility")
          )
        );
      case "activation":
        return (
          video.primaryPattern !== "cardio_locomotion" &&
          ["accessory", "compound"].includes(video.movementClass) &&
          video.movementClass !== "isolation" &&
          video.variationTier !== "specialist" &&
          (
            video.slotDetails.some((slotDetail) =>
              ["activation_glute", "activation_core", "activation_scapula"].includes(slotDetail),
            ) ||
            video.primaryPattern === "core" ||
            video.primaryPattern === "balance_stability" ||
            hasAnyBuilderTag(video, ["activation_upper", "activation_lower", "activation_core", "activation_full"])
          )
        );
      case "main":
        if (!["compound", "conditioning", "power"].includes(video.movementClass)) {
          return false;
        }

        if (
          inputs.focusArea === "upper_body" &&
          ["strength", "tone", "general_fitness"].includes(inputs.goal)
        ) {
          return ["upper_push", "upper_pull"].includes(video.balanceBucket);
        }

        if (
          inputs.focusArea === "full_body" &&
          !["conditioning", "fat_burn"].includes(inputs.goal) &&
          video.primaryPattern === "cardio_locomotion"
        ) {
          return false;
        }

        return video.balanceBucket !== "mobility_recovery";
      case "accessory":
        if (!["accessory", "isolation", "compound"].includes(video.movementClass)) {
          return false;
        }

        if (inputs.focusArea === "upper_body") {
          return (
            hasAnyBuilderTag(video, ["accessory_upper", "accessory_core", "strength_core", "anti_rotation"]) ||
            video.primaryPattern === "core"
          );
        }

        return video.balanceBucket !== "mobility_recovery";
      case "cooldown":
        return (
          video.intensityEstimate === "low" &&
          ["mobility", "recovery"].includes(video.movementClass) &&
          (
            hasAnyBuilderTag(video, getRelaxedCooldownTags(inputs)) ||
            (inputs.focusArea === "full_body" && video.primaryPattern === "mobility")
          )
        );
      case "finisher":
        return !video.advancedRisk && video.impactLevel !== "low";
      default:
        return true;
    }
  });
}

function pickTopCandidates(
  ranked: ScoredVideoCandidate[],
  block: BlockTemplate,
  inputs: WorkoutInputs,
  sessionSelections: SelectedExercise[],
  language: AppLanguage,
  variationSeed: number,
): ScoredVideoCandidate[] {
  const picked: ScoredVideoCandidate[] = [];
  const remaining = [...ranked];

  while (picked.length < block.maxExercises && remaining.length > 0) {
    const shadowVideos = picked.map((item) => item.video);
    const shadowPrescriptions = createBlockPrescriptions(shadowVideos, block, inputs, language);
    const shadowSelections = picked.map((item, index) => ({
      video: item.video,
      role: block.role,
      order: sessionSelections.length + index + 1,
      score: item.score,
      whySelected: item.whySelected,
      prescription: shadowPrescriptions[index],
    }));

    const rescoredCandidates = remaining
      .filter((candidate) => !shouldSkipDuplicateFamily(candidate, picked, block.role))
      .map((candidate) =>
        scoreVideo(candidate.video, {
          role: block.role,
          inputs,
          language,
          sessionSelections,
          blockSelections: shadowSelections,
        }),
      )
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => compareCandidates(left, right, variationSeed));

    if (rescoredCandidates.length === 0) {
      break;
    }

    const next = rescoredCandidates[0];
    picked.push(next);
    const nextIndex = remaining.findIndex((candidate) => candidate.video.id === next.video.id);
    if (nextIndex >= 0) {
      remaining.splice(nextIndex, 1);
    }
  }

  if (picked.length < block.minExercises) {
    for (const candidate of ranked) {
      if (picked.some((item) => item.video.id === candidate.video.id)) {
        continue;
      }

      picked.push(candidate);

      if (picked.length >= block.minExercises) {
        break;
      }
    }
  }

  return picked;
}

function hasAnyBuilderTag(video: VideoItem, tags: readonly BuilderTag[]): boolean {
  return tags.some((tag) => video.builderTags.includes(tag));
}

function shouldSkipDuplicateFamily(
  candidate: ScoredVideoCandidate,
  picked: ScoredVideoCandidate[],
  role: BlockTemplate["role"],
): boolean {
  if (!candidate.video.exerciseFamily && !candidate.video.movementFamilyDetailed) {
    return false;
  }

  if (!["warmup", "activation", "cooldown"].includes(role)) {
    return false;
  }

  return picked.some(
    (item) =>
      item.video.exerciseFamily === candidate.video.exerciseFamily ||
      item.video.movementFamilyDetailed === candidate.video.movementFamilyDetailed,
  );
}

function getRelaxedWarmupTags(inputs: WorkoutInputs): BuilderTag[] {
  switch (inputs.focusArea) {
    case "upper_body":
      return ["prep_upper", "prep_core", "activation_upper", "activation_core", "scapular_control", "mobility_thoracic", "anti_rotation"];
    case "lower_body":
      return ["prep_lower", "prep_core", "activation_lower", "activation_core", "mobility_hips"];
    case "core":
      return ["prep_core", "activation_core", "anti_rotation"];
    case "full_body":
    default:
      return ["prep_upper", "prep_lower", "prep_core", "prep_full", "activation_full"];
  }
}

function getRelaxedCooldownTags(inputs: WorkoutInputs): BuilderTag[] {
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

function compareCandidates(
  left: ScoredVideoCandidate,
  right: ScoredVideoCandidate,
  variationSeed: number,
): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  return stableSeedSort(right.video.id, variationSeed) - stableSeedSort(left.video.id, variationSeed);
}

function stableSeedSort(id: number, seed: number): number {
  return Math.abs((id * 37 + seed * 101) % 997);
}

function estimateSessionIntensity(items: SelectedExercise[]): IntensityEstimate {
  if (items.length === 0) {
    return "low";
  }

  const average =
    items.reduce((total, item) => total + intensityToScore(item.video.intensityEstimate), 0) / items.length;

  if (average >= 4.2) {
    return "high";
  }

  if (average >= 3.4) {
    return "medium_high";
  }

  if (average >= 2.4) {
    return "medium";
  }

  if (average >= 1.6) {
    return "low_medium";
  }

  return "low";
}

function estimateSessionImpact(items: SelectedExercise[]): "low" | "medium" | "high" {
  if (items.some((item) => item.video.impactLevel === "high")) {
    return "high";
  }

  if (items.some((item) => item.video.impactLevel === "medium")) {
    return "medium";
  }

  return "low";
}

function collectEquipmentUsed(items: SelectedExercise[]) {
  return Array.from(
    new Set(items.flatMap((item) => item.video.equipmentTypes).filter((equipment) => equipment !== "bodyweight")),
  );
}

function buildSessionTitle(
  inputs: WorkoutInputs,
  language: AppLanguage,
): string {
  const focus = getFocusLabel(language, inputs.focusArea);
  const goal = getGoalLabel(language, inputs.goal);
  const level = getLevelLabel(language, inputs.level);

  if (language === "hu") {
    return `${inputs.duration} perces ${level.toLowerCase()} ${focus.toLowerCase()} ${goal.toLowerCase()} edz\u00e9s`;
  }

  return `${inputs.duration}-Min ${level} ${focus} ${goal}`;
}

function buildSessionSummary(
  inputs: WorkoutInputs,
  intensity: IntensityEstimate,
  language: AppLanguage,
): string {
  const focus = getFocusLabel(language, inputs.focusArea).toLowerCase();
  const goal = getGoalLabel(language, inputs.goal).toLowerCase();
  const pace =
    inputs.stylePreference === "interval"
      ? language === "hu"
        ? "r\u00f6vid munkaszakaszokkal"
        : "short working bursts"
      : inputs.stylePreference === "flow"
        ? language === "hu"
          ? "folyamatos mozg\u00e1sflow-val"
          : "smooth movement flow"
        : language === "hu"
          ? "tiszt\u00e1n ism\u00e9telhet\u0151 temp\u00f3val"
          : "clear, repeatable pacing";
  const impactLabel = getImpactLabel(language, inputs.impactTolerance).toLowerCase();
  const intensityLabel = getIntensityLabel(language, intensity).toLowerCase();

  if (language === "hu") {
    return `Ez a session ${focus} ${goal} munk\u00e1ra f\u00f3kusz\u00e1l ${pace}, ${impactLabel} terhel\u00e9si v\u00e1laszt\u00e1ssal \u00e9s becs\u00fclt ${intensityLabel} intenzit\u00e1ssal.`;
  }

  return `This session focuses on ${focus} ${goal} work with ${pace}, ${impactLabel} impact choices, and an estimated ${intensityLabel} effort.`;
}

function buildSafetyNotes(
  inputs: WorkoutInputs,
  constraintWarning: string | undefined,
  language: AppLanguage,
): string[] {
  const notes: string[] = [];

  if (inputs.impactTolerance === "low" || inputs.goal === "low_impact") {
    notes.push(
      language === "hu"
        ? "Alacsony terhel\u00e9s\u0171 v\u00e1laszt\u00e1si szab\u00e1lyok lettek alkalmazva."
        : "Low-impact selection rules were applied.",
    );
  }

  if (inputs.level === "beginner" || inputs.simpleMode) {
    notes.push(
      language === "hu"
        ? "A builder egyszer\u0171bb mozg\u00e1sflow-t \u00e9s kevesebb hirtelen \u00e1tmenetet r\u00e9szes\u00edtett el\u0151nyben."
        : "The builder favored simpler movement flow and fewer abrupt transitions.",
    );
  }

  if (inputs.physicalLimitations.includes("knee_sensitive")) {
    notes.push(
      language === "hu"
        ? "A t\u00e9rd\u00e9rz\u00e9keny sz\u0171r\u00e9s cs\u00f6kkentette az ugr\u00e1l\u00f3s \u00e9s \u00e9rkez\u00e9s-terhel\u00e9s\u0171 opci\u00f3kat."
        : "Knee-sensitive filtering reduced jump-heavy and landing-heavy options.",
    );
  }

  if (inputs.physicalLimitations.includes("lower_back_sensitive")) {
    notes.push(
      language === "hu"
        ? "A der\u00e9k\u00e9rz\u00e9keny sz\u0171r\u00e9s kontroll\u00e1lt t\u00f6rzsstabiliz\u00e1l\u00e1st \u00e9s kisebb kock\u00e1zat\u00fa mint\u00e1kat prefer\u00e1lt."
        : "Lower-back-sensitive filtering favored controlled trunk support and lower-risk patterns.",
    );
  }

  if (inputs.physicalLimitations.includes("shoulder_sensitive")) {
    notes.push(
      language === "hu"
        ? "A v\u00e1ll\u00e9rz\u00e9keny sz\u0171r\u00e9s visszafogta a fels\u0151 testes tol\u00f3 \u00e9s fej f\u00f6l\u00e9 emel\u0151 terhel\u00e9st."
        : "Shoulder-sensitive filtering reduced upper-body pushing and overhead stress.",
    );
  }

  if (inputs.physicalLimitations.includes("wrist_sensitive")) {
    notes.push(
      language === "hu"
        ? "A csukl\u00f3\u00e9rz\u00e9keny sz\u0171r\u00e9s cs\u00f6kkentette a plankes \u00e9s talajon t\u00e1maszkod\u00f3 tol\u00f3 vari\u00e1ci\u00f3kat."
        : "Wrist-sensitive filtering reduced plank-heavy and floor-loaded pushing options.",
    );
  }

  if (constraintWarning) {
    notes.push(constraintWarning);
  }

  return notes;
}

function intensityToScore(intensity: IntensityEstimate): number {
  switch (intensity) {
    case "low":
      return 1;
    case "low_medium":
      return 2;
    case "medium":
      return 3;
    case "medium_high":
      return 4;
    case "high":
      return 5;
    default:
      return 3;
  }
}
