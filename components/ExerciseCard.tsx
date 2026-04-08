import BodyFocusSilhouette from "@/components/BodyFocusSilhouette";
import { getExerciseFocusProfile } from "@/lib/bodyFocus";
import {
  formatElapsedClockLocalized,
  formatTagLabel,
  getImpactLabel,
  getPatternLabel,
  getRoleLabel,
  getSecondaryVideoTitle,
  getUiCopy,
  getVideoTitle,
} from "@/lib/i18n";
import type { AppLanguage, SelectedExercise } from "@/types/workout";

interface ExerciseCardProps {
  cumulativeSeconds: number;
  language: AppLanguage;
  item: SelectedExercise;
  showBodyFocus: boolean;
  showReason: boolean;
  onExclude: (id: number) => void;
}

export default function ExerciseCard({
  cumulativeSeconds,
  language,
  item,
  showBodyFocus,
  showReason,
  onExclude,
}: ExerciseCardProps) {
  const copy = getUiCopy(language);
  const focusProfile = showBodyFocus
    ? getExerciseFocusProfile(item.video, language)
    : null;

  return (
    <article className="rounded-[18px] border border-[rgba(23,33,30,0.08)] bg-white/78 p-3 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-2">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#17211e] text-sm font-semibold text-white">
                {item.order}
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold leading-6 text-[#17211e]">
                  {getVideoTitle(item.video, language)}
                </p>
                <p className="text-sm leading-5 text-[#5a655f]">
                  {getSecondaryVideoTitle(item.video, language)}
                </p>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {item.video.tags.slice(0, 5).map((tag) => (
                <span
                  className="rounded-full border border-[rgba(23,33,30,0.08)] bg-[rgba(23,33,30,0.04)] px-2.5 py-1 text-xs font-medium text-[#5a655f]"
                  key={tag}
                >
                  {formatTagLabel(language, tag)}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-end">
            <span className="rounded-full border border-[rgba(216,111,69,0.18)] bg-[rgba(216,111,69,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#c34d23]">
              {getRoleLabel(language, item.role)}
            </span>
            <span className="rounded-full border border-[rgba(23,33,30,0.1)] bg-[rgba(23,33,30,0.04)] px-3 py-1 text-xs font-semibold text-[#5a655f]">
              {copy.cumulativeTime}: {formatElapsedClockLocalized(language, cumulativeSeconds)}
            </span>
            <button
              className="text-sm font-semibold text-[#5a655f] underline decoration-[rgba(23,33,30,0.2)] underline-offset-4"
              onClick={() => onExclude(item.video.id)}
              type="button"
            >
              {copy.excludeAndRebuild}
            </button>
          </div>
        </div>

        <div
          className={`grid gap-3 ${
            showBodyFocus
              ? showReason
                ? "xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_240px]"
                : "xl:grid-cols-[minmax(0,1.5fr)_240px]"
              : showReason
                ? "md:grid-cols-2"
                : "grid-cols-1"
          }`}
        >
          <div className="rounded-[14px] bg-[rgba(23,33,30,0.03)] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5a655f]">
              {copy.prescription}
            </p>
            <p className="mt-1.5 text-sm font-semibold leading-6 text-[#17211e]">
              {item.prescription.summary}
            </p>
            {item.prescription.loadGuidance ? (
              <p className="mt-1 text-sm leading-5 text-[#5a655f]">{item.prescription.loadGuidance}</p>
            ) : null}
          </div>

          {showReason ? (
            <div className="rounded-[14px] bg-[rgba(23,33,30,0.03)] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5a655f]">
                {copy.whySelected}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-[#17211e]">{item.whySelected}</p>
            </div>
          ) : null}

          {focusProfile ? (
            <BodyFocusSilhouette language={language} profile={focusProfile} />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#5a655f]">
          <span>
            {copy.pattern}: {getPatternLabel(language, item.video.primaryPattern)}
          </span>
          <span>
            {copy.impact}: {getImpactLabel(language, item.video.impactLevel)}
          </span>
          <a
            className="font-semibold text-[#17211e] underline decoration-[rgba(23,33,30,0.2)] underline-offset-4"
            href={item.video.videoUrl}
            rel="noreferrer"
            target="_blank"
          >
            {copy.openSourceVideo}
          </a>
        </div>
      </div>
    </article>
  );
}
