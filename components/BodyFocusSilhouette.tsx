import type { ReactNode } from "react";
import {
  getViewLabel,
  type ExerciseFocusProfile,
} from "@/lib/bodyFocus";
import type { AppLanguage, AnatomyZone } from "@/types/workout";

interface BodyFocusSilhouetteProps {
  profile: ExerciseFocusProfile;
  language: AppLanguage;
}

const BASE_FILL = "rgba(23,33,30,0.10)";
const BASE_STROKE = "rgba(23,33,30,0.08)";

export default function BodyFocusSilhouette({
  profile,
  language,
}: BodyFocusSilhouetteProps) {
  return (
    <div className="w-full max-w-[240px] rounded-[16px] border border-[rgba(23,33,30,0.08)] bg-[rgba(255,255,255,0.74)] p-3">
      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-[#c34d23]">
        {profile.title}
      </p>
      <p className="mt-1 text-xs leading-5 text-[#5a655f]">{profile.summary}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <SilhouetteView
          label={getViewLabel(language, "front")}
          zones={profile.frontZones}
          view="front"
        />
        <SilhouetteView
          label={getViewLabel(language, "back")}
          zones={profile.backZones}
          view="back"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {profile.legendZones.map((zone) => (
          <span
            className="rounded-full border border-[rgba(216,111,69,0.16)] bg-[rgba(216,111,69,0.1)] px-2 py-1 text-[0.7rem] font-semibold text-[#a84724]"
            key={`${zone.view}-${zone.zone}`}
          >
            {zone.label}
          </span>
        ))}
      </div>
    </div>
  );
}

interface SilhouetteViewProps {
  label: string;
  zones: ExerciseFocusProfile["frontZones"];
  view: "front" | "back";
}

function SilhouetteView({
  label,
  zones,
  view,
}: SilhouetteViewProps) {
  return (
    <div className="rounded-[14px] bg-[rgba(23,33,30,0.03)] px-2 py-2">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#5a655f]">
        {label}
      </p>
      <svg
        aria-label={label}
        className="mx-auto mt-1.5 h-[114px] w-[72px]"
        role="img"
        viewBox="0 0 72 114"
      >
        <circle cx="36" cy="10" fill={BASE_FILL} r="7" stroke={BASE_STROKE} />
        <rect fill={BASE_FILL} height="24" rx="10" stroke={BASE_STROKE} width="22" x="25" y="20" />
        <rect fill={BASE_FILL} height="28" rx="5" stroke={BASE_STROKE} width="8" x="15" y="24" />
        <rect fill={BASE_FILL} height="28" rx="5" stroke={BASE_STROKE} width="8" x="49" y="24" />
        <rect fill={BASE_FILL} height="16" rx="8" stroke={BASE_STROKE} width="18" x="27" y="44" />
        <rect fill={BASE_FILL} height="28" rx="6" stroke={BASE_STROKE} width="10" x="28" y="58" />
        <rect fill={BASE_FILL} height="28" rx="6" stroke={BASE_STROKE} width="10" x="34" y="58" />
        <rect fill={BASE_FILL} height="22" rx="6" stroke={BASE_STROKE} width="9" x="27" y="84" />
        <rect fill={BASE_FILL} height="22" rx="6" stroke={BASE_STROKE} width="9" x="36" y="84" />

        {view === "front" ? renderFrontZones(zones) : renderBackZones(zones)}
      </svg>
    </div>
  );
}

function renderFrontZones(zones: ExerciseFocusProfile["frontZones"]) {
  return (
    <>
      {renderZone(zones, "shoulders_front", (
        <>
          <rect height="8" rx="4" width="16" x="16" y="18" />
          <rect height="8" rx="4" width="16" x="40" y="18" />
        </>
      ))}
      {renderZone(zones, "arms_front", (
        <>
          <rect height="28" rx="5" width="8" x="15" y="24" />
          <rect height="28" rx="5" width="8" x="49" y="24" />
        </>
      ))}
      {renderZone(zones, "chest", (
        <rect height="14" rx="7" width="22" x="25" y="24" />
      ))}
      {renderZone(zones, "core_front", (
        <rect height="20" rx="8" width="18" x="27" y="38" />
      ))}
      {renderZone(zones, "hips_front", (
        <rect height="12" rx="6" width="18" x="27" y="48" />
      ))}
      {renderZone(zones, "quads", (
        <>
          <rect height="28" rx="6" width="10" x="28" y="58" />
          <rect height="28" rx="6" width="10" x="34" y="58" />
        </>
      ))}
    </>
  );
}

function renderBackZones(zones: ExerciseFocusProfile["backZones"]) {
  return (
    <>
      {renderZone(zones, "shoulders_back", (
        <>
          <rect height="8" rx="4" width="16" x="16" y="18" />
          <rect height="8" rx="4" width="16" x="40" y="18" />
        </>
      ))}
      {renderZone(zones, "arms_back", (
        <>
          <rect height="28" rx="5" width="8" x="15" y="24" />
          <rect height="28" rx="5" width="8" x="49" y="24" />
        </>
      ))}
      {renderZone(zones, "upper_back", (
        <rect height="16" rx="7" width="22" x="25" y="24" />
      ))}
      {renderZone(zones, "lower_back", (
        <rect height="14" rx="7" width="18" x="27" y="42" />
      ))}
      {renderZone(zones, "glutes", (
        <rect height="14" rx="7" width="18" x="27" y="50" />
      ))}
      {renderZone(zones, "hamstrings_calves", (
        <>
          <rect height="28" rx="6" width="10" x="28" y="58" />
          <rect height="28" rx="6" width="10" x="34" y="58" />
          <rect height="22" rx="6" width="9" x="27" y="84" />
          <rect height="22" rx="6" width="9" x="36" y="84" />
        </>
      ))}
    </>
  );
}

function renderZone(
  zones: ExerciseFocusProfile["frontZones"],
  zoneName: AnatomyZone,
  content: ReactNode,
) {
  const zone = zones.find((entry) => entry.zone === zoneName);
  if (!zone) {
    return null;
  }

  return (
    <g
      fill={`rgba(216,111,69,${zone.intensity.toFixed(2)})`}
      stroke={`rgba(195,77,35,${Math.max(0.22, zone.intensity - 0.12).toFixed(2)})`}
    >
      {content}
    </g>
  );
}
