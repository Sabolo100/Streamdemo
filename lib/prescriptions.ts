import type {
  AppLanguage,
  BlockTemplate,
  ExercisePrescription,
  SessionRole,
  VideoItem,
  WorkoutInputs,
} from "@/types/workout";

export function createPrescription(
  video: VideoItem,
  block: BlockTemplate,
  inputs: WorkoutInputs,
  language: AppLanguage,
): ExercisePrescription {
  switch (block.role) {
    case "warmup":
      return makeWarmupPrescription(block.targetMinutes, language);
    case "activation":
      return makeActivationPrescription(video, inputs, language);
    case "main":
      return makeMainPrescription(video, inputs, language);
    case "accessory":
      return makeAccessoryPrescription(video, inputs, language);
    case "finisher":
      return makeFinisherPrescription(inputs, language);
    case "cooldown":
      return makeCooldownPrescription(video, language);
    default:
      return makeMainPrescription(video, inputs, language);
  }
}

function makeWarmupPrescription(
  targetMinutes: number,
  language: AppLanguage,
): ExercisePrescription {
  const workSeconds = targetMinutes >= 7 ? 40 : 35;
  return {
    format: "time",
    rounds: 1,
    workSeconds,
    restSeconds: 10,
    summary:
      language === "hu"
        ? `${workSeconds} mp laza el\u0151k\u00e9sz\u00edt\u00e9s, minim\u00e1lis pihen\u0151`
        : `${workSeconds} sec smooth prep, minimal rest`,
  };
}

function makeActivationPrescription(
  video: VideoItem,
  inputs: WorkoutInputs,
  language: AppLanguage,
): ExercisePrescription {
  if (video.primaryPattern === "core" || video.positionType === "floor") {
    const holdSeconds = inputs.level === "beginner" ? 25 : 30;
    return {
      format: "hold",
      rounds: 2,
      holdSeconds,
      restSeconds: 15,
      summary:
        language === "hu"
          ? `${holdSeconds} mp tart\u00e1s x 2 k\u00f6r, 15 mp \u00e1t\u00e1ll\u00e1ssal`
          : `${holdSeconds} sec hold x 2 rounds, 15 sec reset`,
    };
  }

  return {
    format: "reps",
    rounds: 2,
    reps: language === "hu" ? "8-10 ism\u00e9tl\u00e9s" : "8-10 reps",
    restSeconds: 20,
    summary:
      language === "hu"
        ? "8-10 ism\u00e9tl\u00e9s x 2 k\u00f6r, kontroll\u00e1lt temp\u00f3"
        : "8-10 reps x 2 rounds, controlled pace",
  };
}

function makeMainPrescription(
  video: VideoItem,
  inputs: WorkoutInputs,
  language: AppLanguage,
): ExercisePrescription {
  if (
    inputs.goal === "strength" ||
    inputs.goal === "tone" ||
    inputs.stylePreference === "strength"
  ) {
    const reps = inputs.level === "beginner" ? "8-10 reps" : "8-12 reps";
    const rounds = inputs.duration === 60 ? 3 : 2;
    return {
      format: "reps",
      rounds,
      reps,
      restSeconds: inputs.level === "beginner" ? 30 : 25,
      loadGuidance: video.equipmentTypes.includes("bodyweight")
        ? language === "hu"
          ? "Saj\u00e1t tests\u00faly vagy lass\u00fa temp\u00f3"
          : "Bodyweight or slow tempo"
        : language === "hu"
          ? "K\u00f6nny\u0171 vagy k\u00f6zepes terhel\u00e9s"
          : "Light to moderate load",
      summary:
        language === "hu"
          ? `${toHungarianReps(reps)} x ${rounds} k\u00f6r, ${inputs.level === "beginner" ? 30 : 25} mp pihen\u0151`
          : `${reps} x ${rounds} rounds, ${inputs.level === "beginner" ? 30 : 25} sec rest`,
    };
  }

  if (inputs.goal === "fat_burn" || inputs.goal === "conditioning" || inputs.stylePreference === "interval") {
    const workSeconds = inputs.duration === 60 ? 45 : 40;
    const rounds = inputs.duration === 30 ? 2 : 3;
    return {
      format: "time",
      rounds,
      workSeconds,
      restSeconds: 15,
      summary:
        language === "hu"
          ? `${workSeconds} mp munka / 15 mp pihen\u0151 x ${rounds} k\u00f6r`
          : `${workSeconds} sec work / 15 sec rest x ${rounds} rounds`,
    };
  }

  if (inputs.goal === "mobility" || inputs.goal === "low_impact") {
    return {
      format: "time",
      rounds: 2,
      workSeconds: 35,
      restSeconds: 15,
      summary:
        language === "hu"
          ? "35 mp folyamatos ism\u00e9tl\u00e9s / 15 mp \u00e1t\u00e1ll\u00e1s x 2 k\u00f6r"
          : "35 sec smooth reps / 15 sec reset x 2 rounds",
    };
  }

  if (video.primaryPattern === "core") {
    return {
      format: "hold",
      rounds: 2,
      holdSeconds: inputs.level === "beginner" ? 25 : 35,
      restSeconds: 15,
      summary:
        language === "hu"
          ? `${inputs.level === "beginner" ? 25 : 35} mp tart\u00e1s x 2 k\u00f6r`
          : `${inputs.level === "beginner" ? 25 : 35} sec hold x 2 rounds`,
    };
  }

  return {
    format: "reps",
    rounds: inputs.duration === 60 ? 3 : 2,
    reps: inputs.level === "beginner" ? "10-12 reps" : "10-15 reps",
    restSeconds: 20,
    summary:
      language === "hu"
        ? `${inputs.level === "beginner" ? "10-12" : "10-15"} ism\u00e9tl\u00e9s x ${inputs.duration === 60 ? 3 : 2} k\u00f6r`
        : `${inputs.level === "beginner" ? "10-12" : "10-15"} reps x ${inputs.duration === 60 ? 3 : 2} rounds`,
  };
}

function makeAccessoryPrescription(
  video: VideoItem,
  inputs: WorkoutInputs,
  language: AppLanguage,
): ExercisePrescription {
  if (video.primaryPattern === "core" || inputs.focusArea === "core") {
    const holdSeconds = inputs.level === "beginner" ? 20 : 30;
    return {
      format: "hold",
      rounds: 2,
      holdSeconds,
      restSeconds: 15,
      summary:
        language === "hu"
          ? `${holdSeconds} mp tart\u00e1s x 2 k\u00f6r`
          : `${holdSeconds} sec hold x 2 rounds`,
    };
  }

  return {
    format: "reps",
    rounds: 2,
    reps:
      language === "hu"
        ? inputs.level === "beginner"
          ? "8-12 ism\u00e9tl\u00e9s"
          : "10-15 ism\u00e9tl\u00e9s"
        : inputs.level === "beginner"
          ? "8-12 reps"
          : "10-15 reps",
    restSeconds: 20,
    summary:
      language === "hu"
        ? `${inputs.level === "beginner" ? "8-12" : "10-15"} ism\u00e9tl\u00e9s x 2 k\u00f6r`
        : `${inputs.level === "beginner" ? "8-12" : "10-15"} reps x 2 rounds`,
  };
}

function makeFinisherPrescription(
  inputs: WorkoutInputs,
  language: AppLanguage,
): ExercisePrescription {
  const workSeconds = inputs.duration === 60 ? 45 : 35;
  const rounds = inputs.energy === "high" ? 3 : 2;
  return {
    format: "time",
    rounds,
    workSeconds,
    restSeconds: 15,
    summary:
      language === "hu"
        ? `${workSeconds} mp munka / 15 mp pihen\u0151 x ${rounds} k\u00f6r`
        : `${workSeconds} sec push / 15 sec rest x ${rounds} rounds`,
  };
}

function makeCooldownPrescription(
  video: VideoItem,
  language: AppLanguage,
): ExercisePrescription {
  if (video.primaryPattern === "mobility") {
    return {
      format: "hold",
      rounds: 1,
      holdSeconds: 30,
      summary:
        language === "hu"
          ? "30 mp k\u00f6nny\u0171 tart\u00e1s vagy 4-5 lass\u00fa l\u00e9gz\u00e9s"
          : "30 sec easy hold or 4-5 slow breaths",
    };
  }

  return {
    format: "time",
    rounds: 1,
    workSeconds: 30,
    summary: language === "hu" ? "30 mp laza levezet\u00e9s" : "30 sec light reset",
  };
}

export function getRoleLoadCue(role: SessionRole): string | undefined {
  if (role === "main") {
    return "Choose a challenging but controlled load.";
  }

  if (role === "accessory") {
    return "Keep this smooth and clean rather than heavy.";
  }

  return undefined;
}

function toHungarianReps(reps: string): string {
  return reps.replace(" reps", " ism\u00e9tl\u00e9s");
}
