from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANONICAL_CSV_PATH = ROOT / "data" / "video_taxonomy_ssot.csv"
AUDIT_REPORT_PATH = ROOT / "data" / "video_taxonomy_builder_audit.json"


def split_pipe_list(value: str) -> list[str]:
    return [part.strip() for part in str(value or "").split("|") if part.strip()]


def read_rows() -> list[dict[str, str]]:
    with CANONICAL_CSV_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def build_sample(row: dict[str, str]) -> dict[str, object]:
    return {
        "id": int(row["id"]),
        "title_original": row["title_original"],
        "english_title": row["english_title"],
        "content_kind": row["content_kind"],
        "asset_kind": row.get("asset_kind", ""),
        "builder_status": row.get("builder_status", ""),
        "primary_pattern": row["primary_pattern"],
        "source_body_region": row.get("source_body_region", ""),
        "body_region": row["body_region"],
        "movement_family_detailed": row.get("movement_family_detailed", ""),
        "movement_class": row.get("movement_class", ""),
        "variation_tier": row.get("variation_tier", ""),
        "prescription_profile": row.get("prescription_profile", ""),
        "balance_bucket": row.get("balance_bucket", ""),
        "slot_details": split_pipe_list(row.get("slot_details", "")),
        "session_role_fit": split_pipe_list(row["session_role_fit"]),
        "builder_tags": split_pipe_list(row["builder_tags"]),
        "validation_errors": split_pipe_list(row["validation_errors"]),
    }


def main() -> None:
    rows = read_rows()

    content_kind_counts = Counter(row["content_kind"] for row in rows)
    asset_kind_counts = Counter(row.get("asset_kind", "") for row in rows)
    builder_status_counts = Counter(row.get("builder_status", "") for row in rows)
    preferred_format_counts = Counter(row["preferred_format"] for row in rows)
    balance_bucket_counts = Counter(row.get("balance_bucket", "") for row in rows)
    movement_family_counts = Counter(row.get("movement_family_detailed", "") for row in rows)
    contraction_style_counts = Counter(row.get("contraction_style", "") for row in rows)
    movement_class_counts = Counter(row.get("movement_class", "") for row in rows)
    variation_tier_counts = Counter(row.get("variation_tier", "") for row in rows)
    prescription_profile_counts = Counter(row.get("prescription_profile", "") for row in rows)
    environment_access_counts = Counter(row.get("environment_access", "") for row in rows)
    slot_detail_counts = Counter(
        slot
        for row in rows
        for slot in split_pipe_list(row.get("slot_details", ""))
    )
    technical_gate_counts = Counter(
        gate
        for row in rows
        for gate in split_pipe_list(row.get("technical_gates", ""))
    )
    role_counts = Counter(
        role
        for row in rows
        for role in split_pipe_list(row["session_role_fit"])
    )
    builder_tag_counts = Counter(
        tag
        for row in rows
        for tag in split_pipe_list(row["builder_tags"])
    )

    tutorial_like_main = [
        build_sample(row)
        for row in rows
        if row["content_kind"] == "tutorial"
        and "main" in split_pipe_list(row["session_role_fit"])
    ][:30]

    include_non_single_assets = [
        build_sample(row)
        for row in rows
        if row.get("builder_status", "") == "include"
        and row.get("asset_kind", "") != "exercise_single"
    ][:30]

    warmup_without_prep = [
        build_sample(row)
        for row in rows
        if "warmup" in split_pipe_list(row["session_role_fit"])
        and not set(split_pipe_list(row["builder_tags"])).intersection(
            {"prep_upper", "prep_lower", "prep_core", "prep_full"},
        )
    ][:30]

    activation_without_slot = [
        build_sample(row)
        for row in rows
        if "activation" in split_pipe_list(row["session_role_fit"])
        and not set(split_pipe_list(row.get("slot_details", ""))).intersection(
            {"activation_glute", "activation_core", "activation_scapula"},
        )
    ][:30]

    upper_main_without_push_pull = [
        build_sample(row)
        for row in rows
        if row["content_kind"] == "exercise"
        and "main" in split_pipe_list(row["session_role_fit"])
        and row["body_region"] == "upper_body"
        and row.get("balance_bucket", "") not in {"upper_push", "upper_pull"}
    ][:30]

    isolation_marked_main = [
        build_sample(row)
        for row in rows
        if row.get("movement_class", "") == "isolation"
        and "main" in split_pipe_list(row["session_role_fit"])
    ][:30]

    specialist_marked_include = [
        build_sample(row)
        for row in rows
        if row.get("variation_tier", "") == "specialist"
        and row.get("builder_status", "") == "include"
    ][:30]

    report = {
        "source_of_truth": str(CANONICAL_CSV_PATH),
        "row_count": len(rows),
        "content_kind_counts": dict(content_kind_counts),
        "asset_kind_counts": dict(asset_kind_counts),
        "builder_status_counts": dict(builder_status_counts),
        "preferred_format_counts": dict(preferred_format_counts),
        "balance_bucket_counts": dict(balance_bucket_counts),
        "movement_family_counts": dict(movement_family_counts),
        "contraction_style_counts": dict(contraction_style_counts),
        "movement_class_counts": dict(movement_class_counts),
        "variation_tier_counts": dict(variation_tier_counts),
        "prescription_profile_counts": dict(prescription_profile_counts),
        "environment_access_counts": dict(environment_access_counts),
        "slot_detail_counts": dict(slot_detail_counts),
        "technical_gate_counts": dict(technical_gate_counts),
        "role_counts": dict(role_counts),
        "builder_tag_counts": dict(builder_tag_counts),
        "coverage_summary": {
            "prep_upper": builder_tag_counts.get("prep_upper", 0),
            "prep_lower": builder_tag_counts.get("prep_lower", 0),
            "prep_core": builder_tag_counts.get("prep_core", 0),
            "activation_upper": builder_tag_counts.get("activation_upper", 0),
            "activation_lower": builder_tag_counts.get("activation_lower", 0),
            "activation_core": builder_tag_counts.get("activation_core", 0),
            "strength_upper_push": builder_tag_counts.get("strength_upper_push", 0),
            "strength_upper_pull": builder_tag_counts.get("strength_upper_pull", 0),
            "strength_lower_squat": builder_tag_counts.get("strength_lower_squat", 0),
            "strength_lower_hinge": builder_tag_counts.get("strength_lower_hinge", 0),
            "strength_lower_lunge": builder_tag_counts.get("strength_lower_lunge", 0),
            "strength_core": builder_tag_counts.get("strength_core", 0),
            "recovery_breathing": builder_tag_counts.get("recovery_breathing", 0),
            "scapular_control": builder_tag_counts.get("scapular_control", 0),
            "anti_rotation": builder_tag_counts.get("anti_rotation", 0),
            "main_strength": slot_detail_counts.get("main_strength", 0),
            "conditioning": slot_detail_counts.get("conditioning", 0),
            "power": slot_detail_counts.get("power", 0),
            "upper_push_bucket": balance_bucket_counts.get("upper_push", 0),
            "upper_pull_bucket": balance_bucket_counts.get("upper_pull", 0),
            "trunk_bucket": balance_bucket_counts.get("trunk", 0),
            "compound_count": movement_class_counts.get("compound", 0),
            "accessory_count": movement_class_counts.get("accessory", 0),
            "isolation_count": movement_class_counts.get("isolation", 0),
            "standard_variations": variation_tier_counts.get("standard", 0),
            "regression_variations": variation_tier_counts.get("regression", 0),
        },
        "suspicious_samples": {
            "tutorial_like_main": tutorial_like_main,
            "include_non_single_assets": include_non_single_assets,
            "warmup_without_prep": warmup_without_prep,
            "activation_without_slot": activation_without_slot,
            "upper_main_without_push_pull": upper_main_without_push_pull,
            "isolation_marked_main": isolation_marked_main,
            "specialist_marked_include": specialist_marked_include,
        },
    }

    AUDIT_REPORT_PATH.write_text(
        json.dumps(report, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Wrote builder taxonomy audit to {AUDIT_REPORT_PATH}")
    print(
        "Coverage:"
        f" prep_upper={builder_tag_counts.get('prep_upper', 0)},"
        f" activation_upper={builder_tag_counts.get('activation_upper', 0)},"
        f" strength_upper_push={builder_tag_counts.get('strength_upper_push', 0)},"
        f" strength_upper_pull={builder_tag_counts.get('strength_upper_pull', 0)}",
    )


if __name__ == "__main__":
    main()
