import { getRoleLabel } from "@/lib/i18n";
import type { AppLanguage, BlockTemplate, WorkoutInputs } from "@/types/workout";

const BASE_BUDGETS = {
  30: { warmup: 5, activation: 3, main: 17, accessory: 5, finisher: 4, cooldown: 3 },
  45: { warmup: 6, activation: 4, main: 24, accessory: 7, finisher: 5, cooldown: 4 },
  60: { warmup: 8, activation: 5, main: 31, accessory: 9, finisher: 6, cooldown: 5 },
} as const;

export function getSessionTemplate(
  inputs: WorkoutInputs,
  language: AppLanguage,
): BlockTemplate[] {
  const budgets = BASE_BUDGETS[inputs.duration];
  const blocks: BlockTemplate[] = [];
  const wantsFinisher = shouldIncludeFinisher(inputs);
  const needsActivation = shouldIncludeActivation(inputs);

  const addBlock = (
    role: BlockTemplate["role"],
    targetMinutes: number,
    minExercises: number,
    maxExercises: number,
    optional = false,
  ) => {
    blocks.push({
      role,
      label: getRoleLabel(language, role),
      targetMinutes,
      minExercises,
      maxExercises,
      optional,
    });
  };

  switch (inputs.goal) {
    case "strength":
    case "tone":
      addBlock("warmup", budgets.warmup, 3, 4);
      if (needsActivation) {
        addBlock("activation", budgets.activation, 1, 2, inputs.duration === 30);
      }
      addBlock("main", budgets.main, 4, inputs.duration === 60 ? 6 : 5);
      addBlock("accessory", budgets.accessory, 2, 3);
      if (wantsFinisher) {
        addBlock("finisher", budgets.finisher, 2, 3, true);
      }
      addBlock("cooldown", budgets.cooldown, 2, 3);
      break;
    case "fat_burn":
    case "conditioning":
      addBlock("warmup", budgets.warmup, 3, 4);
      addBlock("main", budgets.main, 4, inputs.duration === 60 ? 7 : 5);
      if (wantsFinisher) {
        addBlock("finisher", budgets.finisher, 2, 3, true);
      }
      addBlock("cooldown", budgets.cooldown, 2, 3);
      break;
    case "mobility":
    case "low_impact":
      addBlock("warmup", budgets.warmup, 3, 4);
      addBlock("main", budgets.main, 4, 5);
      addBlock("accessory", budgets.accessory, 2, 3);
      addBlock("cooldown", budgets.cooldown, 2, 3);
      break;
    case "core":
      addBlock("warmup", budgets.warmup, 3, 4);
      if (needsActivation) {
        addBlock("activation", budgets.activation, 1, 2, inputs.duration === 30);
      }
      addBlock("main", budgets.main, 4, 5);
      addBlock("accessory", budgets.accessory, 2, 3);
      addBlock("cooldown", budgets.cooldown, 2, 3);
      break;
    case "general_fitness":
    default:
      addBlock("warmup", budgets.warmup, 3, 4);
      if (needsActivation && inputs.duration >= 45) {
        addBlock("activation", budgets.activation, 1, 2, true);
      }
      addBlock("main", budgets.main, 4, inputs.duration === 60 ? 6 : 5);
      addBlock("accessory", budgets.accessory, 2, 3);
      addBlock("cooldown", budgets.cooldown, 2, 3);
      break;
  }

  return rebalanceSimpleMode(blocks, inputs);
}

function shouldIncludeActivation(inputs: WorkoutInputs): boolean {
  if (inputs.simpleMode && inputs.duration === 30) {
    return false;
  }

  return ["strength", "tone", "core"].includes(inputs.goal) || inputs.duration >= 45;
}

function shouldIncludeFinisher(inputs: WorkoutInputs): boolean {
  if (inputs.goal === "mobility" || inputs.goal === "low_impact") {
    return false;
  }

  if (inputs.impactTolerance === "low" && inputs.goal !== "conditioning") {
    return false;
  }

  return (
    inputs.duration >= 45 &&
    !inputs.simpleMode &&
    (inputs.energy === "high" || inputs.goal === "fat_burn" || inputs.goal === "conditioning")
  );
}

function rebalanceSimpleMode(blocks: BlockTemplate[], inputs: WorkoutInputs): BlockTemplate[] {
  if (!inputs.simpleMode) {
    return blocks;
  }

  return blocks.map((block) => {
    if (block.role === "main") {
      return {
        ...block,
        maxExercises: Math.max(block.minExercises, block.maxExercises - 1),
      };
    }

    if (block.role === "accessory" || block.role === "cooldown") {
      return {
        ...block,
        maxExercises: block.minExercises,
      };
    }

    return block;
  });
}
