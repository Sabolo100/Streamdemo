import ExerciseCard from "@/components/ExerciseCard";
import { formatDurationLocalized } from "@/lib/i18n";
import type { AppLanguage, SessionBlock as SessionBlockType } from "@/types/workout";

interface SessionBlockProps {
  block: SessionBlockType;
  language: AppLanguage;
  showBodyFocus: boolean;
  showReason: boolean;
  onExcludeExercise: (id: number) => void;
  startingElapsedSeconds: number;
}

export default function SessionBlock({
  block,
  language,
  showBodyFocus,
  showReason,
  onExcludeExercise,
  startingElapsedSeconds,
}: SessionBlockProps) {
  let cumulativeSeconds = startingElapsedSeconds;

  return (
    <section className="rounded-[24px] border border-[rgba(23,33,30,0.08)] bg-[rgba(255,255,255,0.66)] p-4">
      <div className="flex flex-col gap-2 border-b border-[rgba(23,33,30,0.08)] pb-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1">
          <h3 className="text-[1.7rem] font-semibold tracking-tight text-[#17211e]">
            {block.label}
          </h3>
        </div>
        <span className="chip">{formatDurationLocalized(language, block.targetMinutes)}</span>
      </div>

      <div className="mt-3.5 grid gap-3">
        {block.items.map((item) => {
          cumulativeSeconds += item.prescription.estimatedSeconds;

          return (
            <ExerciseCard
              cumulativeSeconds={cumulativeSeconds}
              item={item}
              key={`${block.role}-${item.video.id}`}
              language={language}
              onExclude={onExcludeExercise}
              showBodyFocus={showBodyFocus}
              showReason={showReason}
            />
          );
        })}
      </div>
    </section>
  );
}
