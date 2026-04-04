from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any
import unicodedata

from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "Resoruces" / "streamfit_video_taxonomy_autotagged.xlsx"
CANONICAL_CSV_PATH = ROOT / "data" / "video_taxonomy_ssot.csv"
CANONICAL_JSON_PATH = ROOT / "data" / "video_taxonomy_ssot.json"
VALIDATION_REPORT_PATH = ROOT / "data" / "video_taxonomy_validation_report.json"
LEGACY_OUTPUT_PATH = ROOT / "data" / "videos.json"

ALLOWED_HOME_EQUIPMENT = {
    "bodyweight",
    "dumbbell",
    "kettlebell",
    "band",
    "trx",
    "bench_or_box",
}

GYM_SETUP_EQUIPMENT = {"barbell", "ring", "rope", "bosu", "weighted_vest"}
AMBIGUOUS_HOME_EQUIPMENT = {"sandbag", "medball", "other"}

WARMUP_KEYWORDS = {
    "warm",
    "mobility",
    "march",
    "prep",
    "rotation",
    "thoracic",
    "reach",
    "open",
}

COOLDOWN_KEYWORDS = {
    "stretch",
    "breathing",
    "release",
    "cooldown",
    "hip flexor",
    "groin",
    "thoracic",
}

ACTIVATION_KEYWORDS = {
    "bridge",
    "dead bug",
    "bird dog",
    "scap",
    "anti rotation",
    "anti-rotation",
    "hollow",
    "plank",
}

FINISHER_KEYWORDS = {
    "jump",
    "hop",
    "burpee",
    "thruster",
    "swing",
    "mountain climber",
    "high knees",
    "skater",
}

ADVANCED_RISK_KEYWORDS = {
    "snatch",
    "clean",
    "turkish get up",
    "turkish get-up",
    "pistol",
    "windmill",
    "handstand",
    "muscle up",
}

LARGE_SPACE_KEYWORDS = {
    "sprint",
    "run",
    "shuffle",
    "broad jump",
    "bear crawl",
    "crawl",
}

TITLE_EQUIPMENT_KEYWORDS = {
    "trx": "trx",
    "kettlebell": "kettlebell",
    "dumbbell": "dumbbell",
    "dumbell": "dumbbell",
    "banded": "band",
    "band ": "band",
    " band": "band",
    "resistance band": "band",
    "mini band": "band",
    "gumikotel": "band",
    "gumiszalag": "band",
    "bench": "bench_or_box",
    "box": "bench_or_box",
    "step up": "bench_or_box",
    "pad": "bench_or_box",
    "doboz": "bench_or_box",
    "barbell": "barbell",
    "rud": "barbell",
    "landmine": "other",
    "plate": "other",
    "tarcsa": "other",
    "ring": "ring",
    "gyuru": "ring",
    "rope": "rope",
    "weighted vest": "weighted_vest",
    "sulymelleny": "weighted_vest",
    "sandbag": "sandbag",
    "homokzsak": "sandbag",
    "medball": "medball",
    "medicine ball": "medball",
    "bosu": "bosu",
}

GYM_SETUP_TITLE_KEYWORDS = {
    "landmine",
    "machine",
    "cable",
    "smith",
    "pulley",
}

ANCHOR_SETUP_KEYWORDS = {
    "pull up",
    "chin up",
    "dip",
    "hanging leg raise",
    "hanging scapular",
    "bar hang",
    "muscle up",
}

TRX_ANCHOR_EXCEPTIONS = {
    "trx pull up",
    "trx chin up",
    "trx dip",
}

COOLDOWN_EXCLUSION_KEYWORDS = {
    "plank",
    "copenhagen",
    "hip lift",
    "bridge",
    "dead bug",
    "bird dog",
    "wall sit",
}


def normalize_pipe_list(value: Any) -> list[str]:
    if value is None:
        return []

    text = str(value).strip()
    if not text or text.lower() == "none":
        return []

    return [part.strip() for part in text.split("|") if part.strip()]


def normalize_intensity(value: Any) -> str:
    text = str(value or "medium").strip().lower().replace("-", "_").replace(" ", "_")
    if text not in {"low", "low_medium", "medium", "medium_high", "high"}:
        return "medium"
    return text


def normalize_pattern(value: Any) -> str:
    text = str(value or "mixed_other").strip().lower()
    if text == "core_flexion" or text == "core_rotation" or text == "core_anti_extension":
        return "core"
    return text or "mixed_other"


def title_contains(title: str, keywords: set[str]) -> bool:
    return any(keyword in title for keyword in keywords)


def simplify_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    return " ".join(ascii_text.lower().replace("-", " ").replace("/", " ").split())


def infer_equipment_from_title(title: str) -> list[str]:
    found: set[str] = set()
    for keyword, equipment in TITLE_EQUIPMENT_KEYWORDS.items():
        if keyword in title:
            found.add(equipment)
    return sorted(found)


def pipe_join(values: list[str]) -> str:
    return "|".join(values)


def merge_equipment(raw_equipment: list[str], inferred_equipment: list[str]) -> list[str]:
    merged = set(raw_equipment)
    merged.update(inferred_equipment)

    if not merged:
        return ["bodyweight"]

    return sorted(merged)


def derive_roles(base_roles: list[str], title: str, pattern: str, body_region: str, intensity: str) -> list[str]:
    roles = set(base_roles)

    if title_contains(title, COOLDOWN_EXCLUSION_KEYWORDS):
        roles.discard("cooldown")

    if title_contains(title, {"plank", "copenhagen", "wall sit", "thruster"}):
        roles.discard("warmup")

    if pattern == "mobility" or title_contains(title, WARMUP_KEYWORDS):
        roles.update({"warmup", "accessory"})

    if (
        pattern == "mobility"
        and intensity == "low"
        and not title_contains(title, COOLDOWN_EXCLUSION_KEYWORDS)
    ):
        roles.add("cooldown")

    if title_contains(title, COOLDOWN_KEYWORDS) and not title_contains(title, COOLDOWN_EXCLUSION_KEYWORDS):
        roles.update({"cooldown", "warmup"})

    if title_contains(title, ACTIVATION_KEYWORDS):
        roles.update({"activation", "accessory"})

    if pattern in {"squat", "lunge", "hinge", "push", "pull"}:
        roles.add("main")

    if body_region == "core" or pattern == "core":
        roles.add("accessory")
        if intensity in {"low", "medium"}:
            roles.add("activation")

    if pattern == "cardio_locomotion" or title_contains(title, FINISHER_KEYWORDS):
        roles.update({"finisher", "main"})

    if not roles:
        roles.add("main" if pattern in {"squat", "lunge", "hinge", "push", "pull"} else "accessory")

    return sorted(roles)


def derive_requires_large_space(title: str, pattern: str) -> bool:
    return pattern == "cardio_locomotion" and title_contains(title, LARGE_SPACE_KEYWORDS)


def derive_advanced_risk(title: str, complexity: str) -> bool:
    return complexity == "complex" or title_contains(title, ADVANCED_RISK_KEYWORDS)


def derive_requires_partner(title: str) -> bool:
    return "partner" in title


def requires_anchor_setup(title: str, equipment: list[str]) -> bool:
    if "trx" in equipment and title_contains(title, TRX_ANCHOR_EXCEPTIONS):
        return False

    return title_contains(title, ANCHOR_SETUP_KEYWORDS)


def derive_requires_gym_setup(equipment: list[str], title: str) -> bool:
    return (
        any(item in GYM_SETUP_EQUIPMENT for item in equipment)
        or "machine" in title
        or title_contains(title, GYM_SETUP_TITLE_KEYWORDS)
        or requires_anchor_setup(title, equipment)
    )


def build_qa_flags(
    raw_equipment: list[str],
    inferred_equipment: list[str],
    equipment: list[str],
    title: str,
    requires_gym_setup: bool,
    home_safe: bool,
    session_roles: list[str],
) -> list[str]:
    flags: list[str] = []

    if inferred_equipment:
        flags.append(f"equipment_inferred:{pipe_join(inferred_equipment)}")

    if raw_equipment != equipment:
        flags.append("canonical_equipment_differs_from_source")

    if requires_gym_setup:
        flags.append("gym_setup_required")

    if requires_anchor_setup(title, equipment):
        flags.append("fixed_anchor_or_bar_required")

    if not home_safe:
        flags.append("excluded_from_home_safe_pool")

    if "cooldown" in session_roles and title_contains(title, COOLDOWN_EXCLUSION_KEYWORDS):
        flags.append("cooldown_role_removed_by_validation")

    return flags


def validate_runtime_record(record: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    title = simplify_text(record["titleOriginal"])
    equipment = set(record["equipmentTypes"])

    if "landmine" in title and record["homeSafe"]:
        errors.append("landmine_item_marked_home_safe")

    if ("banded" in title or "gumikotel" in title) and "band" not in equipment:
        errors.append("band_keyword_missing_band_equipment")

    if requires_anchor_setup(title, list(equipment)) and not record["requiresGymSetup"]:
        errors.append("anchor_based_exercise_missing_gym_setup_flag")

    if any(keyword in title for keyword in ["barbell", "rud", "plate", "tarcsa"]) and record["homeSafe"]:
        errors.append("loaded_barbell_or_plate_item_marked_home_safe")

    if "cooldown" in record["sessionRoleFit"] and title_contains(title, COOLDOWN_EXCLUSION_KEYWORDS):
        errors.append("cooldown_role_contains_non_cooldown_title")

    if record["homeSafe"] and any(item not in ALLOWED_HOME_EQUIPMENT for item in equipment):
        errors.append("home_safe_item_contains_disallowed_equipment")

    return errors


def write_csv(rows: list[dict[str, Any]]) -> None:
    if not rows:
        raise ValueError("No taxonomy rows to write.")

    fieldnames = list(rows[0].keys())
    with CANONICAL_CSV_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def derive_home_safe(equipment: list[str], requires_large_space: bool, requires_partner: bool, requires_gym_setup: bool) -> bool:
    if requires_large_space or requires_partner or requires_gym_setup:
        return False

    if any(item in AMBIGUOUS_HOME_EQUIPMENT for item in equipment):
        return False

    return all(item in ALLOWED_HOME_EQUIPMENT for item in equipment)


def build_tags(
    equipment: list[str],
    pattern: str,
    body_region: str,
    impact: str,
    complexity: str,
    position: str,
) -> list[str]:
    tags = set(equipment)
    tags.update({pattern, body_region, impact, complexity, position})
    return sorted(tag for tag in tags if tag)


def main() -> None:
    workbook = load_workbook(SOURCE_PATH, read_only=True, data_only=True)
    sheet = workbook["AutoTaggedVideos"]
    rows = sheet.iter_rows(values_only=True)
    headers = [str(value) if value is not None else "" for value in next(rows)]
    index = {header: position for position, header in enumerate(headers)}

    runtime_videos: list[dict[str, Any]] = []
    canonical_rows: list[dict[str, Any]] = []
    validation_errors: dict[int, list[str]] = {}

    for row in rows:
      raw_equipment = normalize_pipe_list(row[index["equipment_type"]])
      title = str(row[index["english_title"]] or "").strip()
      title_original = str(row[index["title_original"]] or title).strip()
      title_search = simplify_text(title_original)
      inferred_equipment = infer_equipment_from_title(title_search)
      equipment = merge_equipment(raw_equipment, inferred_equipment)
      pattern = normalize_pattern(row[index["primary_pattern"]])
      secondary_pattern = normalize_pattern(row[index["secondary_pattern"]]) if row[index["secondary_pattern"]] else None
      body_region = str(row[index["body_region"]] or "full_body").strip().lower()
      impact = str(row[index["impact_level"]] or "low").strip().lower()
      complexity = str(row[index["complexity_level"]] or "basic").strip().lower()
      intensity = normalize_intensity(row[index["intensity_estimate"]])
      position = str(row[index["position_type"]] or "standing").strip().lower()
      contraindications = normalize_pipe_list(row[index["contraindications"]])
      base_roles = normalize_pipe_list(row[index["session_role_fit"]])
      requires_large_space = derive_requires_large_space(title_search, pattern)
      requires_partner = derive_requires_partner(title_search)
      requires_gym_setup = derive_requires_gym_setup(equipment, title_search)
      advanced_risk = derive_advanced_risk(title_search, complexity)
      session_roles = derive_roles(base_roles, title_search, pattern, body_region, intensity)
      home_safe = derive_home_safe(
          equipment,
          requires_large_space,
          requires_partner,
          requires_gym_setup,
      )

      runtime_record = {
          "id": int(row[index["id"]]),
          "titleOriginal": title_original,
          "title": title,
          "titleHu": str(row[index["hungarian_title"]] or "").strip(),
          "videoUrl": str(row[index["video_url"]] or "").strip(),
          "equipmentTypes": equipment or ["bodyweight"],
          "primaryPattern": pattern,
          "secondaryPattern": secondary_pattern,
          "bodyRegion": body_region,
          "impactLevel": impact,
          "complexityLevel": complexity,
          "intensityEstimate": intensity,
          "unilateral": str(row[index["unilateral_flag"]] or "no").strip().lower() == "yes",
          "positionType": position,
          "sessionRoleFit": session_roles,
          "beginnerFriendly": str(row[index["beginner_friendly"]] or "conditional").strip().lower(),
          "contraindications": contraindications,
          "homeSafe": home_safe,
          "requiresLargeSpace": requires_large_space,
          "requiresPartner": requires_partner,
          "requiresGymSetup": requires_gym_setup,
          "advancedRisk": advanced_risk,
          "tags": build_tags(equipment, pattern, body_region, impact, complexity, position),
      }

      errors = validate_runtime_record(runtime_record)
      if errors:
          validation_errors[runtime_record["id"]] = errors

      canonical_rows.append(
          {
              "id": runtime_record["id"],
              "title_original": title_original,
              "english_title": title,
              "hungarian_title": runtime_record["titleHu"],
              "video_url": runtime_record["videoUrl"],
              "source_equipment_types": pipe_join(raw_equipment),
              "inferred_equipment_types": pipe_join(inferred_equipment),
              "canonical_equipment_types": pipe_join(runtime_record["equipmentTypes"]),
              "primary_pattern": pattern,
              "secondary_pattern": secondary_pattern or "",
              "body_region": body_region,
              "impact_level": impact,
              "complexity_level": complexity,
              "intensity_estimate": intensity,
              "position_type": position,
              "unilateral_flag": "yes" if runtime_record["unilateral"] else "no",
              "beginner_friendly": runtime_record["beginnerFriendly"],
              "session_role_fit": pipe_join(session_roles),
              "contraindications": pipe_join(contraindications),
              "home_safe": "yes" if home_safe else "no",
              "requires_large_space": "yes" if requires_large_space else "no",
              "requires_partner": "yes" if requires_partner else "no",
              "requires_gym_setup": "yes" if requires_gym_setup else "no",
              "advanced_risk": "yes" if advanced_risk else "no",
              "qa_flags": pipe_join(
                  build_qa_flags(
                      raw_equipment,
                      inferred_equipment,
                      runtime_record["equipmentTypes"],
                      title_search,
                      requires_gym_setup,
                      home_safe,
                      session_roles,
                  )
              ),
              "validation_errors": pipe_join(errors),
              "taxonomy_status": "validated" if not errors else "needs_review",
          }
      )

      runtime_videos.append(runtime_record)

    write_csv(canonical_rows)
    CANONICAL_JSON_PATH.write_text(
        json.dumps(runtime_videos, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    LEGACY_OUTPUT_PATH.write_text(
        json.dumps(runtime_videos, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    VALIDATION_REPORT_PATH.write_text(
        json.dumps(
            {
                "source_workbook": str(SOURCE_PATH),
                "canonical_csv": str(CANONICAL_CSV_PATH),
                "canonical_json": str(CANONICAL_JSON_PATH),
                "row_count": len(runtime_videos),
                "validation_error_count": len(validation_errors),
                "validation_errors": validation_errors,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Wrote canonical taxonomy CSV to {CANONICAL_CSV_PATH}")
    print(f"Wrote canonical runtime JSON to {CANONICAL_JSON_PATH}")
    print(f"Wrote validation report to {VALIDATION_REPORT_PATH}")


if __name__ == "__main__":
    main()
