from __future__ import annotations

import csv
import json
import sys
import unicodedata
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
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

COOLDOWN_EXCLUSION_KEYWORDS = {
    "plank",
    "copenhagen",
    "hip lift",
    "bridge",
    "dead bug",
    "bird dog",
    "wall sit",
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


def split_pipe_list(value: str) -> list[str]:
    return [part.strip() for part in str(value or "").split("|") if part.strip()]


def parse_bool(value: str) -> bool:
    return str(value).strip().lower() == "yes"


def simplify_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    return " ".join(ascii_text.lower().replace("-", " ").replace("/", " ").split())


def title_contains(title: str, keywords: set[str]) -> bool:
    return any(keyword in title for keyword in keywords)


def requires_anchor_setup(title: str, equipment: set[str]) -> bool:
    if "trx" in equipment and title_contains(title, TRX_ANCHOR_EXCEPTIONS):
        return False

    return title_contains(title, ANCHOR_SETUP_KEYWORDS)


def validate_runtime_record(record: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    title = simplify_text(record["titleOriginal"])
    equipment = set(record["equipmentTypes"])

    if "landmine" in title and record["homeSafe"]:
        errors.append("landmine_item_marked_home_safe")

    if ("banded" in title or "gumikotel" in title) and "band" not in equipment:
        errors.append("band_keyword_missing_band_equipment")

    if requires_anchor_setup(title, equipment) and not record["requiresGymSetup"]:
        errors.append("anchor_based_exercise_missing_gym_setup_flag")

    if any(keyword in title for keyword in ["barbell", "rud", "plate", "tarcsa"]) and record["homeSafe"]:
        errors.append("loaded_barbell_or_plate_item_marked_home_safe")

    if "cooldown" in record["sessionRoleFit"] and title_contains(title, COOLDOWN_EXCLUSION_KEYWORDS):
        errors.append("cooldown_role_contains_non_cooldown_title")

    if record["homeSafe"] and any(item not in ALLOWED_HOME_EQUIPMENT for item in equipment):
        errors.append("home_safe_item_contains_disallowed_equipment")

    return errors


def read_canonical_rows() -> list[dict[str, str]]:
    with CANONICAL_CSV_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader)


def build_runtime_record(row: dict[str, str]) -> dict[str, Any]:
    return {
        "id": int(row["id"]),
        "titleOriginal": row["title_original"],
        "title": row["english_title"],
        "titleHu": row["hungarian_title"],
        "videoUrl": row["video_url"],
        "equipmentTypes": split_pipe_list(row["canonical_equipment_types"]),
        "primaryPattern": row["primary_pattern"],
        "secondaryPattern": row["secondary_pattern"] or None,
        "bodyRegion": row["body_region"],
        "impactLevel": row["impact_level"],
        "complexityLevel": row["complexity_level"],
        "intensityEstimate": row["intensity_estimate"],
        "unilateral": parse_bool(row["unilateral_flag"]),
        "positionType": row["position_type"],
        "sessionRoleFit": split_pipe_list(row["session_role_fit"]),
        "beginnerFriendly": row["beginner_friendly"],
        "contraindications": split_pipe_list(row["contraindications"]),
        "homeSafe": parse_bool(row["home_safe"]),
        "requiresLargeSpace": parse_bool(row["requires_large_space"]),
        "requiresPartner": parse_bool(row["requires_partner"]),
        "requiresGymSetup": parse_bool(row["requires_gym_setup"]),
        "advancedRisk": parse_bool(row["advanced_risk"]),
        "tags": sorted(
            {
                *split_pipe_list(row["canonical_equipment_types"]),
                row["primary_pattern"],
                row["body_region"],
                row["impact_level"],
                row["complexity_level"],
                row["position_type"],
            }
        ),
    }


def main() -> None:
    rows = read_canonical_rows()
    runtime_records = [build_runtime_record(row) for row in rows]

    validation_errors: dict[int, list[str]] = {}
    for record in runtime_records:
        errors = validate_runtime_record(record)
        if errors:
            validation_errors[record["id"]] = errors

    CANONICAL_JSON_PATH.write_text(
        json.dumps(runtime_records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    LEGACY_OUTPUT_PATH.write_text(
        json.dumps(runtime_records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    VALIDATION_REPORT_PATH.write_text(
        json.dumps(
            {
                "source_of_truth": str(CANONICAL_CSV_PATH),
                "canonical_json": str(CANONICAL_JSON_PATH),
                "row_count": len(runtime_records),
                "validation_error_count": len(validation_errors),
                "validation_errors": validation_errors,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"Built runtime taxonomy JSON from {CANONICAL_CSV_PATH}")
    print(f"Validation errors: {len(validation_errors)}")

    if validation_errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
