"use client";

import {
  DURATION_OPTIONS,
  ENERGY_OPTIONS,
  EQUIPMENT_OPTIONS,
  FOCUS_OPTIONS,
  GOAL_OPTIONS,
  IMPACT_OPTIONS,
  LEVEL_OPTIONS,
  LIMITATION_OPTIONS,
  STYLE_OPTIONS,
} from "@/lib/taxonomy";
import {
  LANGUAGE_OPTIONS,
  getEnergyLabel,
  getEquipmentOptionLabel,
  getFocusLabel,
  getGoalLabel,
  getImpactLabel,
  getLanguageLabel,
  getLevelLabel,
  getLimitationLabel,
  getStyleLabel,
  getUiCopy,
} from "@/lib/i18n";
import type {
  AppLanguage,
  EquipmentOption,
  PhysicalLimitation,
  WorkoutInputs,
} from "@/types/workout";

interface InputPanelProps {
  language: AppLanguage;
  inputs: WorkoutInputs;
  onLanguageChange: (language: AppLanguage) => void;
  onChange: (nextInputs: WorkoutInputs) => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  onClearExclusions: () => void;
  isGenerating: boolean;
  excludedCount: number;
}

export default function InputPanel({
  language,
  inputs,
  onLanguageChange,
  onChange,
  onGenerate,
  onRegenerate,
  onClearExclusions,
  isGenerating,
  excludedCount,
}: InputPanelProps) {
  const copy = getUiCopy(language);

  function setField<K extends keyof WorkoutInputs>(field: K, value: WorkoutInputs[K]) {
    onChange({ ...inputs, [field]: value });
  }

  function toggleEquipment(option: EquipmentOption) {
    const current = new Set(inputs.equipment);

    if (option === "bodyweight_only") {
      onChange({ ...inputs, equipment: ["bodyweight_only"] });
      return;
    }

    current.delete("bodyweight_only");

    if (current.has(option)) {
      current.delete(option);
    } else {
      current.add(option);
    }

    onChange({
      ...inputs,
      equipment: current.size > 0 ? Array.from(current) : ["bodyweight_only"],
    });
  }

  function toggleLimitation(option: PhysicalLimitation) {
    const current = new Set(inputs.physicalLimitations);

    if (current.has(option)) {
      current.delete(option);
    } else {
      current.add(option);
    }

    onChange({
      ...inputs,
      physicalLimitations: Array.from(current),
    });
  }

  return (
    <section className="glass-panel p-5 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">{copy.inputs}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#17211e]">
            {copy.sessionSetup}
          </h2>
        </div>
        <span className="chip">{inputs.simpleMode ? copy.simpleModeOn : copy.fullFlow}</span>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="grid gap-4 md:grid-cols-2 xl:col-span-2">
          <OptionGroup
            label={copy.language}
            compact
            modeLabel={copy.single}
            options={LANGUAGE_OPTIONS.map((option) => ({
              value: option,
              label: getLanguageLabel(option),
              active: language === option,
              onClick: () => onLanguageChange(option),
            }))}
          />

          <OptionGroup
            label={copy.duration}
            compact
            modeLabel={copy.single}
            options={DURATION_OPTIONS.map((option) => ({
              value: String(option),
              label: language === "hu" ? `${option} perc` : `${option} min`,
              active: inputs.duration === option,
              onClick: () => setField("duration", option),
            }))}
          />
        </div>

        <OptionGroup
          label={copy.primaryGoal}
          modeLabel={copy.single}
          options={GOAL_OPTIONS.map((option) => ({
            value: option,
            label: getGoalLabel(language, option),
            active: inputs.goal === option,
            onClick: () => setField("goal", option),
          }))}
        />

        <OptionGroup
          label={copy.level}
          modeLabel={copy.single}
          options={LEVEL_OPTIONS.map((option) => ({
            value: option,
            label: getLevelLabel(language, option),
            active: inputs.level === option,
            onClick: () => setField("level", option),
          }))}
        />

        <div className="xl:col-span-2">
          <OptionGroup
            label={copy.equipmentAvailable}
            modeLabel={copy.multi}
            options={EQUIPMENT_OPTIONS.map((option) => ({
              value: option,
              label: getEquipmentOptionLabel(language, option),
              active: inputs.equipment.includes(option),
              onClick: () => toggleEquipment(option),
            }))}
          />
        </div>

        <OptionGroup
          label={copy.focusArea}
          modeLabel={copy.single}
          options={FOCUS_OPTIONS.map((option) => ({
            value: option,
            label: getFocusLabel(language, option),
            active: inputs.focusArea === option,
            onClick: () => setField("focusArea", option),
          }))}
        />

        <OptionGroup
          label={copy.impactTolerance}
          modeLabel={copy.single}
          options={IMPACT_OPTIONS.map((option) => ({
            value: option,
            label: getImpactLabel(language, option),
            active: inputs.impactTolerance === option,
            onClick: () => setField("impactTolerance", option),
          }))}
        />

        <div className="xl:col-span-2">
          <OptionGroup
            label={copy.physicalLimitations}
            helper={copy.physicalLimitationsHelper}
            modeLabel={copy.multi}
            options={LIMITATION_OPTIONS.map((option) => ({
              value: option,
              label: getLimitationLabel(language, option),
              active: inputs.physicalLimitations.includes(option),
              onClick: () => toggleLimitation(option),
            }))}
          />
        </div>

        <OptionGroup
          label={copy.energyToday}
          compact
          modeLabel={copy.single}
          options={ENERGY_OPTIONS.map((option) => ({
            value: option,
            label: getEnergyLabel(language, option),
            active: inputs.energy === option,
            onClick: () => setField("energy", option),
          }))}
        />

        <OptionGroup
          label={copy.stylePreference}
          modeLabel={copy.single}
          options={STYLE_OPTIONS.map((option) => ({
            value: option,
            label: getStyleLabel(language, option),
            active: inputs.stylePreference === option,
            onClick: () => setField("stylePreference", option),
          }))}
        />

        <label className="flex items-center justify-between rounded-[18px] border border-[rgba(23,33,30,0.08)] bg-white/65 px-4 py-3 xl:col-span-2">
          <div>
            <p className="text-sm font-semibold text-[#17211e]">{copy.simpleMode}</p>
            <p className="mt-1 text-sm text-[#5a655f]">{copy.simpleModeHelper}</p>
          </div>

          <button
            className={`relative h-8 w-14 rounded-full transition ${
              inputs.simpleMode ? "bg-[#17211e]" : "bg-[#d8d2c6]"
            }`}
            onClick={() => setField("simpleMode", !inputs.simpleMode)}
            type="button"
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                inputs.simpleMode ? "left-7" : "left-1"
              }`}
            />
          </button>
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:flex-wrap">
        <button
          className="rounded-[18px] bg-[#17211e] px-4 py-4 text-sm font-semibold text-white transition hover:bg-[#23322f] lg:min-w-[220px]"
          onClick={onGenerate}
          type="button"
        >
          {isGenerating ? copy.building : copy.generateWorkout}
        </button>

        <button
          className="rounded-[18px] border border-[rgba(23,33,30,0.12)] bg-white/70 px-4 py-4 text-sm font-semibold text-[#17211e] transition hover:bg-white lg:min-w-[220px]"
          onClick={onRegenerate}
          type="button"
        >
          {copy.regenerateSession}
        </button>

        {excludedCount > 0 ? (
          <button
            className="rounded-[18px] border border-[rgba(216,111,69,0.22)] bg-[rgba(216,111,69,0.12)] px-4 py-3 text-sm font-semibold text-[#c34d23] lg:min-w-[220px]"
            onClick={onClearExclusions}
            type="button"
          >
            {copy.clearExcludedExercises(excludedCount)}
          </button>
        ) : null}
      </div>
    </section>
  );
}

interface OptionGroupProps {
  label: string;
  options: {
    value: string;
    label: string;
    active: boolean;
    onClick: () => void;
  }[];
  helper?: string;
  compact?: boolean;
  modeLabel: string;
}

function OptionGroup({
  label,
  options,
  helper,
  compact = false,
  modeLabel,
}: OptionGroupProps) {
  return (
    <section className="rounded-[22px] border border-[rgba(23,33,30,0.08)] bg-white/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#17211e]">{label}</p>
          {helper ? <p className="mt-1 text-sm text-[#5a655f]">{helper}</p> : null}
        </div>
        <span className="chip">{modeLabel}</span>
      </div>

      <div className={`mt-4 flex flex-wrap gap-2 ${compact ? "gap-3" : ""}`}>
        {options.map((option) => (
          <button
            className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
              option.active
                ? "border-[#17211e] bg-[#17211e] text-white shadow-sm"
                : "border-[rgba(23,33,30,0.1)] bg-[rgba(255,255,255,0.7)] text-[#17211e] hover:bg-white"
            }`}
            key={option.value}
            onClick={option.onClick}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
