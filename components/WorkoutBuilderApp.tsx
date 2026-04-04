"use client";

import { startTransition, useState } from "react";
import InputPanel from "@/components/InputPanel";
import OutputPanel from "@/components/OutputPanel";
import {
  DEFAULT_LANGUAGE,
  formatDurationLocalized,
  getUiCopy,
  getVideoTitle,
} from "@/lib/i18n";
import { buildWorkoutSession } from "@/lib/sessionBuilder";
import { DEFAULT_INPUTS } from "@/lib/taxonomy";
import type {
  AppLanguage,
  GeneratedSession,
  VideoItem,
  WorkoutInputs,
} from "@/types/workout";

interface WorkoutBuilderAppProps {
  videos: VideoItem[];
}

export default function WorkoutBuilderApp({ videos }: WorkoutBuilderAppProps) {
  const [language, setLanguage] = useState<AppLanguage>(DEFAULT_LANGUAGE);
  const [inputs, setInputs] = useState<WorkoutInputs>(DEFAULT_INPUTS);
  const [variationSeed, setVariationSeed] = useState(0);
  const [excludedVideoIds, setExcludedVideoIds] = useState<number[]>([]);
  const [showReasons, setShowReasons] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [session, setSession] = useState<GeneratedSession>(() =>
    buildWorkoutSession(DEFAULT_INPUTS, videos, { language: DEFAULT_LANGUAGE }),
  );
  const copy = getUiCopy(language);

  function generate(
    nextInputs: WorkoutInputs,
    seed: number,
    excludedIds: number[],
    nextLanguage: AppLanguage,
  ) {
    setIsGenerating(true);

    startTransition(() => {
      setSession(
        buildWorkoutSession(nextInputs, videos, {
          variationSeed: seed,
          excludedVideoIds: excludedIds,
          language: nextLanguage,
        }),
      );
      setVariationSeed(seed);
      setIsGenerating(false);
    });
  }

  function handleGenerate() {
    const nextExcludedIds: number[] = [];
    setExcludedVideoIds(nextExcludedIds);
    generate(inputs, 0, nextExcludedIds, language);
  }

  function handleRegenerate() {
    generate(inputs, variationSeed + 1, excludedVideoIds, language);
  }

  function handleExclude(videoId: number) {
    const nextExcludedIds = [...excludedVideoIds, videoId];
    setExcludedVideoIds(nextExcludedIds);
    generate(inputs, variationSeed + 1, nextExcludedIds, language);
  }

  function handleClearExclusions() {
    const nextExcludedIds: number[] = [];
    setExcludedVideoIds(nextExcludedIds);
    generate(inputs, variationSeed + 1, nextExcludedIds, language);
  }

  function handleLanguageChange(nextLanguage: AppLanguage) {
    setLanguage(nextLanguage);
    generate(inputs, variationSeed, excludedVideoIds, nextLanguage);
  }

  async function handleCopy() {
    const text = serializeSession(session, language);

    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <main className="app-shell">
      <section className="glass-panel overflow-hidden">
        <div className="border-b border-[rgba(23,33,30,0.08)] px-6 py-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="section-kicker">{copy.appKicker}</p>
              <h1 className="display-title mt-2">{copy.heroTitle}</h1>
              <p className="subtle-copy mt-4 max-w-2xl text-base leading-7">
                {copy.heroDescription}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="status-pill">{copy.videosLoaded(videos.length)}</span>
              <span className="chip">{copy.futureReadyRepo}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:gap-5 lg:p-5">
          <InputPanel
            excludedCount={excludedVideoIds.length}
            inputs={inputs}
            isGenerating={isGenerating}
            language={language}
            onChange={setInputs}
            onClearExclusions={handleClearExclusions}
            onGenerate={handleGenerate}
            onLanguageChange={handleLanguageChange}
            onRegenerate={handleRegenerate}
          />

          <OutputPanel
            copyState={copyState}
            language={language}
            onCopy={handleCopy}
            onExcludeExercise={handleExclude}
            onToggleReasons={() => setShowReasons((value) => !value)}
            session={session}
            showReasons={showReasons}
          />
        </div>
      </section>
    </main>
  );
}

function serializeSession(
  session: GeneratedSession,
  language: AppLanguage,
): string {
  const copy = getUiCopy(language);
  const lines: string[] = [];
  lines.push(session.title);
  lines.push(session.summaryText);
  lines.push("");

  for (const block of session.blocks) {
    lines.push(`${block.label} (${formatDurationLocalized(language, block.targetMinutes)})`);

    for (const item of block.items) {
      lines.push(
        `${item.order}. ${getVideoTitle(item.video, language)} - ${item.prescription.summary} - ${item.whySelected}`,
      );
    }

    lines.push("");
  }

  if (session.safetyNotes.length > 0) {
    lines.push(`${copy.safetyNotes}:`);
    for (const note of session.safetyNotes) {
      lines.push(`- ${note}`);
    }
  }

  return lines.join("\n");
}
