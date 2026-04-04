from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CANONICAL_CSV_PATH = ROOT / "data" / "video_taxonomy_ssot.csv"
BOOTSTRAP_SCRIPT = ROOT / "scripts" / "import_videos.py"


def main() -> None:
    if CANONICAL_CSV_PATH.exists():
        print(f"Using existing canonical taxonomy at {CANONICAL_CSV_PATH}")
        return

    print(f"Canonical taxonomy not found, bootstrapping from workbook into {CANONICAL_CSV_PATH}")
    result = subprocess.run([sys.executable, str(BOOTSTRAP_SCRIPT)], check=False)
    raise SystemExit(result.returncode)


if __name__ == "__main__":
    main()
