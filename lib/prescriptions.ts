import type {
  AppLanguage,
  BlockTemplate,
  ExercisePrescription,
  PrescriptionFormat,
  SessionRole,
  VideoItem,
  WorkoutInputs,
} from "@/types/workout";

interface BlockPrescriptionPlan {
  rounds: number;
  betweenExercisesSeconds: number;
  betweenRoundsSeconds: number;
  restSeconds: number;
  perSetWorkSeconds: number;
  transitionShareSeconds: number;
}

export function createBlockPrescriptions(
  videos: VideoItem[],
  block: BlockTemplate,
  inputs: WorkoutInputs,
  language: AppLanguage,
): ExercisePrescription[] {
  if (videos.length === 0) {
    return [];
  }

  const formats = videos.map((video) => resolveFormatForRole(video, block.role));
  const plan = buildBlockPlan(block, videos, formats, inputs);

  return videos.map((video, index) =>
    makePrescription(video, block.role, plan, formats[index], inputs, language),
  );
}

function buildBlockPlan(
  block: BlockTemplate,
  videos: VideoItem[],
  formats: PrescriptionFormat[],
  inputs: WorkoutInputs,
): BlockPrescriptionPlan {
  const rounds = resolveRounds(block, videos, inputs);
  const betweenExercisesSeconds = resolveBetweenExercisesSeconds(block.role);
  const betweenRoundsSeconds = resolveBetweenRoundsSeconds(block.role, videos);
  const restSeconds = resolveRestSeconds(block.role, inputs, videos, formats);
  const totalBudgetSeconds = block.targetMinutes * 60;

  const transitionSeconds =
    Math.max(0, videos.length - 1) * betweenExercisesSeconds * rounds +
    Math.max(0, rounds - 1) * betweenRoundsSeconds;
  const restBudgetSeconds = videos.length * rounds * restSeconds;
  const availableWorkSeconds = Math.max(15, totalBudgetSeconds - transitionSeconds - restBudgetSeconds);
  const rawPerSetWorkSeconds = Math.round(availableWorkSeconds / (videos.length * rounds));
  const [minimumWorkSeconds, maximumWorkSeconds] = getWorkBounds(block.role, videos, inputs);
  const perSetWorkSeconds = clamp(rawPerSetWorkSeconds, minimumWorkSeconds, maximumWorkSeconds);
  const transitionShareSeconds = Math.round(transitionSeconds / videos.length);

  return {
    rounds,
    betweenExercisesSeconds,
    betweenRoundsSeconds,
    restSeconds,
    perSetWorkSeconds,
    transitionShareSeconds,
  };
}

function makePrescription(
  video: VideoItem,
  role: SessionRole,
  plan: BlockPrescriptionPlan,
  format: PrescriptionFormat,
  inputs: WorkoutInputs,
  language: AppLanguage,
): ExercisePrescription {
  const estimatedSeconds =
    plan.rounds * (plan.perSetWorkSeconds + plan.restSeconds) + plan.transitionShareSeconds;

  if (format === "hold") {
    return {
      format: "hold",
      rounds: plan.rounds,
      holdSeconds: plan.perSetWorkSeconds,
      restSeconds: plan.restSeconds > 0 ? plan.restSeconds : undefined,
      estimatedSeconds,
      summary: buildHoldSummary(plan, role, language),
      loadGuidance: getLoadGuidance(video, role, language),
    };
  }

  if (format === "time") {
    return {
      format: "time",
      rounds: plan.rounds,
      workSeconds: plan.perSetWorkSeconds,
      restSeconds: plan.restSeconds > 0 ? plan.restSeconds : undefined,
      estimatedSeconds,
      summary: buildTimeSummary(plan, role, video, language),
      loadGuidance: getLoadGuidance(video, role, language),
    };
  }

  const reps = buildRepsSummary(video, role, plan.perSetWorkSeconds, inputs, language);
  return {
    format: "reps",
    rounds: plan.rounds,
    reps,
    restSeconds: plan.restSeconds > 0 ? plan.restSeconds : undefined,
    estimatedSeconds,
    summary: buildRepsBlockSummary(reps, plan, language),
    loadGuidance: getLoadGuidance(video, role, language),
  };
}

function resolveFormatForRole(video: VideoItem, role: SessionRole): PrescriptionFormat {
  if (video.contractionStyle === "isometric_hold") {
    return "hold";
  }

  if (video.prescriptionProfile === "recovery_reset") {
    return "hold";
  }

  if (video.prescriptionProfile === "mobility_prep") {
    return role === "cooldown" ? "hold" : "time";
  }

  if (video.prescriptionProfile === "conditioning_interval" || video.prescriptionProfile === "power_output") {
    return "time";
  }

  if (role === "activation" && video.prescriptionProfile === "core_control") {
    return video.preferredFormat === "reps" ? "reps" : "hold";
  }

  if (role === "cooldown") {
    return video.preferredFormat === "reps" ? "hold" : video.preferredFormat;
  }

  return video.preferredFormat;
}

function resolveRounds(
  block: BlockTemplate,
  videos: VideoItem[],
  inputs: WorkoutInputs,
): number {
  switch (block.role) {
    case "warmup":
      return block.targetMinutes >= 4 && videos.length <= 3 ? 2 : 1;
    case "activation":
      return videos.length === 1 && block.targetMinutes >= 3 ? 3 : 2;
    case "main":
      if (inputs.goal === "conditioning" || inputs.goal === "fat_burn" || inputs.stylePreference === "interval") {
        return block.targetMinutes >= 24 && videos.length <= 4 ? 4 : videos.length <= 4 ? 3 : 2;
      }

      if (videos.every((video) => video.prescriptionProfile === "compound_strength")) {
        if (block.targetMinutes >= 24 && videos.length <= 4) {
          return 4;
        }

        return videos.length <= 4 ? 3 : 2;
      }

      return 2;
    case "accessory":
      return block.targetMinutes >= 6 && videos.length <= 2 ? 3 : 2;
    case "finisher":
      return 2;
    case "cooldown":
      return block.targetMinutes >= 4 && videos.length <= 2 ? 2 : 1;
    default:
      return 2;
  }
}

function resolveBetweenExercisesSeconds(role: SessionRole): number {
  switch (role) {
    case "warmup":
    case "cooldown":
      return 10;
    case "main":
      return 20;
    default:
      return 15;
  }
}

function resolveBetweenRoundsSeconds(role: SessionRole, videos: VideoItem[]): number {
  switch (role) {
    case "main":
      return videos.every((video) => video.prescriptionProfile === "compound_strength") ? 55 : 40;
    case "accessory":
      return 25;
    default:
      return 20;
  }
}

function resolveRestSeconds(
  role: SessionRole,
  inputs: WorkoutInputs,
  videos: VideoItem[],
  formats: PrescriptionFormat[],
): number {
  switch (role) {
    case "warmup":
    case "cooldown":
      return 0;
    case "activation":
      return formats.every((format) => format === "hold") ? 12 : 15;
    case "main":
      if (inputs.goal === "conditioning" || inputs.goal === "fat_burn" || inputs.stylePreference === "interval") {
        return 20;
      }

      if (videos.some((video) => video.prescriptionProfile === "compound_strength")) {
        return inputs.level === "beginner" ? 45 : 60;
      }

      return 30;
    case "accessory":
      if (videos.some((video) => video.prescriptionProfile === "isolation_volume")) {
        return 20;
      }

      return 25;
    case "finisher":
      return 20;
    default:
      return 15;
  }
}

function getWorkBounds(
  role: SessionRole,
  videos: VideoItem[],
  inputs: WorkoutInputs,
): [number, number] {
  if (role === "main" && videos.every((video) => video.prescriptionProfile === "compound_strength")) {
    if (inputs.goal === "strength" || inputs.stylePreference === "strength") {
      return [26, 42];
    }

    return [32, 50];
  }

  switch (role) {
    case "warmup":
      return [24, 36];
    case "activation":
      return [18, 30];
    case "main":
      return [28, 50];
    case "accessory":
      return [22, 38];
    case "finisher":
      return [22, 36];
    case "cooldown":
      return [30, 45];
    default:
      return [25, 40];
  }
}

function buildRepsSummary(
  video: VideoItem,
  role: SessionRole,
  perSetWorkSeconds: number,
  inputs: WorkoutInputs,
  language: AppLanguage,
): string {
  const secondsPerRep = getSecondsPerRep(video, role, inputs);
  const targetReps = Math.max(4, Math.round(perSetWorkSeconds / secondsPerRep));
  const [minReps, maxReps] = getRepBounds(video, role, inputs);
  const clampedReps = clamp(targetReps, minReps, maxReps);
  return formatRepRange(clampedReps, language);
}

function getSecondsPerRep(video: VideoItem, role: SessionRole, inputs: WorkoutInputs): number {
  if (video.prescriptionProfile === "compound_strength") {
    if (inputs.goal === "strength" || inputs.stylePreference === "strength") {
      return video.unilateral ? 6.5 : 5.5;
    }

    return video.unilateral ? 5.5 : 4.5;
  }

  if (video.prescriptionProfile === "isolation_volume") {
    return 3.5;
  }

  if (video.prescriptionProfile === "core_control") {
    return role === "activation" ? 4.5 : 4;
  }

  if (video.unilateral || video.primaryPattern === "hinge" || video.primaryPattern === "lunge") {
    return 5;
  }

  return 4;
}

function getRepBounds(
  video: VideoItem,
  role: SessionRole,
  inputs: WorkoutInputs,
): [number, number] {
  if (role === "activation") {
    return video.prescriptionProfile === "core_control" ? [6, 8] : [5, 8];
  }

  if (role === "main") {
    if (video.prescriptionProfile === "compound_strength") {
      if (inputs.goal === "strength" || inputs.stylePreference === "strength") {
        return inputs.level === "beginner" ? [6, 8] : [5, 8];
      }

      if (inputs.goal === "tone") {
        return [8, 12];
      }

      return inputs.level === "beginner" ? [8, 10] : [8, 12];
    }

    if (video.prescriptionProfile === "core_control") {
      return [6, 10];
    }
  }

  if (video.prescriptionProfile === "isolation_volume") {
    return inputs.level === "beginner" ? [10, 12] : [10, 15];
  }

  if (video.prescriptionProfile === "accessory_volume") {
    return inputs.level === "beginner" ? [8, 12] : [10, 14];
  }

  if (video.prescriptionProfile === "core_control") {
    return [6, 10];
  }

  return [8, 12];
}

function formatRepRange(reps: number, language: AppLanguage): string {
  const minReps = Math.max(4, reps - 1);
  const maxReps = reps + 1;
  return language === "hu" ? `${minReps}-${maxReps} ism\u00e9tl\u00e9s` : `${minReps}-${maxReps} reps`;
}

function buildHoldSummary(
  plan: BlockPrescriptionPlan,
  role: SessionRole,
  language: AppLanguage,
): string {
  if (role === "cooldown") {
    return language === "hu"
      ? `${plan.perSetWorkSeconds} mp k\u00f6nny\u0171 tart\u00e1s vagy 4-5 lass\u00fa l\u00e9gz\u00e9s`
      : `${plan.perSetWorkSeconds} sec easy hold or 4-5 slow breaths`;
  }

  if (plan.restSeconds > 0) {
    return language === "hu"
      ? `${plan.perSetWorkSeconds} mp tart\u00e1s x ${plan.rounds} k\u00f6r, ${plan.restSeconds} mp pihen\u0151`
      : `${plan.perSetWorkSeconds} sec hold x ${plan.rounds} rounds, ${plan.restSeconds} sec rest`;
  }

  return language === "hu"
    ? `${plan.perSetWorkSeconds} mp tart\u00e1s x ${plan.rounds} k\u00f6r`
    : `${plan.perSetWorkSeconds} sec hold x ${plan.rounds} rounds`;
}

function buildTimeSummary(
  plan: BlockPrescriptionPlan,
  role: SessionRole,
  video: VideoItem,
  language: AppLanguage,
): string {
  if (role === "warmup") {
    return language === "hu"
      ? `${plan.perSetWorkSeconds} mp laza el\u0151k\u00e9sz\u00edt\u00e9s, minim\u00e1lis pihen\u0151`
      : `${plan.perSetWorkSeconds} sec smooth prep, minimal rest`;
  }

  if (video.prescriptionProfile === "conditioning_interval" || video.prescriptionProfile === "power_output") {
    return language === "hu"
      ? `${plan.perSetWorkSeconds} mp munka / ${plan.restSeconds} mp pihen\u0151 x ${plan.rounds} k\u00f6r`
      : `${plan.perSetWorkSeconds} sec work / ${plan.restSeconds} sec rest x ${plan.rounds} rounds`;
  }

  if (role === "cooldown") {
    return language === "hu"
      ? `${plan.perSetWorkSeconds} mp k\u00f6nny\u0171 levezet\u00e9s`
      : `${plan.perSetWorkSeconds} sec easy cooldown`;
  }

  return language === "hu"
    ? `${plan.perSetWorkSeconds} mp kontroll\u00e1lt munka x ${plan.rounds} k\u00f6r`
    : `${plan.perSetWorkSeconds} sec controlled work x ${plan.rounds} rounds`;
}

function buildRepsBlockSummary(
  reps: string,
  plan: BlockPrescriptionPlan,
  language: AppLanguage,
): string {
  if (plan.restSeconds > 0) {
    return language === "hu"
      ? `${reps} x ${plan.rounds} k\u00f6r, ${plan.restSeconds} mp pihen\u0151`
      : `${reps} x ${plan.rounds} rounds, ${plan.restSeconds} sec rest`;
  }

  return language === "hu"
    ? `${reps} x ${plan.rounds} k\u00f6r`
    : `${reps} x ${plan.rounds} rounds`;
}

function getLoadGuidance(
  video: VideoItem,
  role: SessionRole,
  language: AppLanguage,
): string | undefined {
  if (video.prescriptionProfile === "compound_strength") {
    if (video.equipmentTypes.every((equipment) => equipment === "bodyweight")) {
      return language === "hu"
        ? "Kontroll\u00e1lt temp\u00f3, 1-2 ism\u00e9tl\u00e9s maradjon tartal\u00e9kban."
        : "Controlled tempo with 1-2 reps left in reserve.";
    }

    return language === "hu"
      ? "K\u00f6zepes terhel\u00e9s, tiszta technika \u00e9s stabil ism\u00e9tl\u00e9sek."
      : "Moderate load with clean technique and stable reps.";
  }

  if (video.prescriptionProfile === "isolation_volume") {
    return language === "hu"
      ? "Kontroll\u00e1lt pump\u00e1l\u00f3 sorozat, lend\u00fclet n\u00e9lk\u00fcl."
      : "Controlled accessory work, no momentum.";
  }

  if (role !== "main") {
    return getRoleLoadCue(role, language);
  }

  return language === "hu"
    ? "Dolgozz tiszta kivitelez\u00e9ssel, teljes kontrollban."
    : "Move with clean execution and full control.";
}

export function getRoleLoadCue(
  role: SessionRole,
  language: AppLanguage,
): string | undefined {
  if (role === "activation") {
    return language === "hu"
      ? "Itt az aktiv\u00e1l\u00e1s \u00e9s a kontroll a fontos, nem a kif\u00e1raszt\u00e1s."
      : "Prioritize activation and control here, not fatigue.";
  }

  if (role === "accessory") {
    return language === "hu"
      ? "Sima, prec\u00edz ism\u00e9tl\u00e9sek, technikailag tiszt\u00e1n."
      : "Keep the reps smooth, precise, and technically clean.";
  }

  return undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
