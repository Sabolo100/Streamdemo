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
    "fuggeszkedes",
    "fuggeszkedesben",
    "huzodzkodas",
    "logas",
    "rudon",
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
    builder_tags = set(record["builderTags"])
    slot_details = set(record["slotDetails"])
    technical_gates = set(record["technicalGates"])

    if "landmine" in title and record["homeSafe"]:
        errors.append("landmine_item_marked_home_safe")
    if ("banded" in title or "gumikotel" in title) and "band" not in equipment:
        errors.append("band_keyword_missing_band_equipment")
    if requires_anchor_setup(title, equipment) and record["environmentAccess"] not in {"anchor_or_rig_needed", "hanging_rig_needed"}:
        errors.append("anchor_based_exercise_missing_environment_access")
    if any(keyword in title for keyword in ["barbell", "rud", "plate", "tarcsa"]) and record["homeSafe"]:
        errors.append("loaded_barbell_or_plate_item_marked_home_safe")
    if "cooldown" in record["sessionRoleFit"] and title_contains(title, COOLDOWN_EXCLUSION_KEYWORDS):
        errors.append("cooldown_role_contains_non_cooldown_title")
    if record["homeSafe"] and any(item not in ALLOWED_HOME_EQUIPMENT and item != "ring" for item in equipment):
        errors.append("home_safe_item_contains_disallowed_equipment")
    if title_contains(title, {"tutorial", "oktato video", "instruction", "how to", "guide"}) and record["contentKind"] != "tutorial":
        errors.append("tutorial_title_missing_tutorial_content_kind")
    if record["contentKind"] == "exercise" and not record["exerciseFamily"]:
        errors.append("exercise_family_missing")
    if record["assetKind"] == "followalong_sequence" and record["builderStatus"] == "include":
        errors.append("followalong_sequence_marked_include")
    if record["contentKind"] == "tutorial" and record["builderStatus"] != "exclude":
        errors.append("tutorial_not_excluded_from_builder")
    if record["contractionStyle"] == "isometric_hold" and record["preferredFormat"] != "hold":
        errors.append("isometric_hold_missing_hold_format")
    if record["contractionStyle"] == "controlled_mobility" and record["preferredFormat"] not in {"time", "hold"}:
        errors.append("mobility_item_missing_time_or_hold_format")
    if record["movementClass"] == "compound" and record["preferredFormat"] == "hold":
        errors.append("compound_item_marked_hold")
    if record["movementClass"] == "isolation" and "main" in record["sessionRoleFit"]:
        errors.append("isolation_item_marked_main")
    if record["movementClass"] == "recovery" and "main" in record["sessionRoleFit"]:
        errors.append("recovery_item_marked_main")
    if "warmup" in record["sessionRoleFit"] and "warmup_mobility" not in slot_details:
        errors.append("warmup_role_missing_slot_detail")
    if "activation" in record["sessionRoleFit"] and not slot_details.intersection({"activation_glute", "activation_core", "activation_scapula"}):
        errors.append("activation_role_missing_slot_detail")
    if "cooldown" in record["sessionRoleFit"] and not slot_details.intersection({"cooldown_breathing", "cooldown_mobility", "cooldown_downregulation"}):
        errors.append("cooldown_role_missing_slot_detail")
    if "main" in record["sessionRoleFit"] and not slot_details.intersection({"main_strength", "conditioning", "power"}):
        errors.append("main_role_missing_slot_detail")
    if "warmup" in record["sessionRoleFit"] and not builder_tags.intersection({"prep_upper", "prep_lower", "prep_core", "prep_full"}):
        errors.append("warmup_role_missing_prep_builder_tags")
    if record["environmentAccess"] == "hanging_rig_needed" and "hanging" not in technical_gates:
        errors.append("hanging_environment_missing_hanging_gate")
    if record["balanceBucket"] == "mobility_recovery" and record["preferredFormat"] == "reps":
        errors.append("mobility_recovery_item_marked_reps")

    return errors


def read_canonical_rows() -> list[dict[str, str]]:
    with CANONICAL_CSV_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def build_runtime_record(row: dict[str, str]) -> dict[str, Any]:
    return {
        "id": int(row["id"]),
        "titleOriginal": row["title_original"],
        "title": row["english_title"],
        "titleHu": row["hungarian_title"],
        "videoUrl": row["video_url"],
        "contentKind": row["content_kind"] or "exercise",
        "assetKind": row.get("asset_kind", "exercise_single") or "exercise_single",
        "builderStatus": row.get("builder_status", "include") or "include",
        "exerciseFamily": row["exercise_family"],
        "movementFamilyDetailed": row.get("movement_family_detailed", "mixed_other") or "mixed_other",
        "builderTags": split_pipe_list(row["builder_tags"]),
        "balanceBucket": row.get("balance_bucket", "total_body") or "total_body",
        "slotDetails": split_pipe_list(row.get("slot_details", "")),
        "preferredFormat": row["preferred_format"] or "reps",
        "equipmentTypes": split_pipe_list(row["canonical_equipment_types"]),
        "primaryPattern": row["primary_pattern"],
        "secondaryPattern": row["secondary_pattern"] or None,
        "bodyRegion": row["body_region"],
        "impactLevel": row["impact_level"],
        "complexityLevel": row["complexity_level"],
        "intensityEstimate": row["intensity_estimate"],
        "unilateral": parse_bool(row["unilateral_flag"]),
        "positionType": row["position_type"],
        "positionDetail": row.get("position_detail", "standing") or "standing",
        "contractionStyle": row.get("contraction_style", "dynamic_reps") or "dynamic_reps",
        "planeOfMotion": row.get("plane_of_motion", "sagittal") or "sagittal",
        "environmentAccess": row.get("environment_access", "home_open") or "home_open",
        "technicalGates": split_pipe_list(row.get("technical_gates", "")) or ["standard"],
        "limbPattern": row.get("limb_pattern", "bilateral") or "bilateral",
        "movementClass": row.get("movement_class", "accessory") or "accessory",
        "variationTier": row.get("variation_tier", "standard") or "standard",
        "prescriptionProfile": row.get("prescription_profile", "accessory_volume") or "accessory_volume",
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
                *split_pipe_list(row["builder_tags"]),
                *split_pipe_list(row.get("slot_details", "")),
                *split_pipe_list(row.get("technical_gates", "")),
                row["primary_pattern"],
                row["body_region"],
                row["impact_level"],
                row["complexity_level"],
                row["position_type"],
                row.get("balance_bucket", ""),
                row.get("movement_family_detailed", ""),
                row.get("environment_access", ""),
                row.get("movement_class", ""),
                row.get("variation_tier", ""),
                row.get("prescription_profile", ""),
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
