import SessionBlock from "@/components/SessionBlock";
import SummaryCard from "@/components/SummaryCard";
import {
  formatDurationLocalized,
  getFocusLabel,
  getIntensityLabel,
  getLevelLabel,
  getStyleLabel,
  getUiCopy,
  summarizeEquipmentLocalized,
} from "@/lib/i18n";
import type { AppLanguage, GeneratedSession } from "@/types/workout";

interface OutputPanelProps {
  language: AppLanguage;
  session: GeneratedSession;
  showReasons: boolean;
  onToggleReasons: () => void;
  onExcludeExercise: (id: number) => void;
  onCopy: () => void;
  copyState: "idle" | "copied" | "failed";
}

export default function OutputPanel({
  language,
  session,
  showReasons,
  onToggleReasons,
  onExcludeExercise,
  onCopy,
  copyState,
}: OutputPanelProps) {
  const copy = getUiCopy(language);

  return (
    <section className="glass-panel p-4 lg:p-5">
      <div className="flex flex-col gap-4 border-b border-[rgba(23,33,30,0.08)] pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">{copy.generatedSession}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#17211e]">
              {session.title}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#5a655f]">
              {session.summaryText}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full border border-[rgba(23,33,30,0.12)] bg-white/70 px-4 py-2 text-sm font-semibold text-[#17211e]"
              onClick={onToggleReasons}
              type="button"
            >
              {showReasons ? copy.hideWhySelected : copy.showWhySelected}
            </button>
            <button
              className="rounded-full border border-[rgba(23,33,30,0.12)] bg-white/70 px-4 py-2 text-sm font-semibold text-[#17211e]"
              onClick={onCopy}
              type="button"
            >
              {copyState === "copied"
                ? copy.copied
                : copyState === "failed"
                  ? copy.copyFailed
                  : copy.copySession}
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label={copy.duration}
            tone="accent"
            value={formatDurationLocalized(language, session.totalDuration)}
          />
          <SummaryCard
            label={copy.profile}
            value={`${getLevelLabel(language, session.inputs.level)} / ${getFocusLabel(language, session.inputs.focusArea)}`}
          />
          <SummaryCard
            label={copy.style}
            value={`${getStyleLabel(language, session.inputs.stylePreference)} / ${getIntensityLabel(language, session.summary.intensity)}`}
          />
          <SummaryCard
            label={copy.equipment}
            tone="dark"
            value={summarizeEquipmentLocalized(language, session.summary.equipmentUsed)}
          />
        </div>

        {session.safetyNotes.length > 0 ? (
          <div className="rounded-[20px] border border-[rgba(216,111,69,0.18)] bg-[rgba(216,111,69,0.08)] p-3.5">
            <p className="text-sm font-semibold text-[#17211e]">{copy.safetyNotes}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {session.safetyNotes.map((note) => (
                <span
                  className="rounded-full border border-[rgba(216,111,69,0.18)] bg-white/70 px-3 py-2 text-sm text-[#5a655f]"
                  key={note}
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4">
        {session.blocks.map((block) => (
          <SessionBlock
            block={block}
            key={`${block.role}-${block.targetMinutes}`}
            language={language}
            onExcludeExercise={onExcludeExercise}
            showReason={showReasons}
          />
        ))}
      </div>
    </section>
  );
}
