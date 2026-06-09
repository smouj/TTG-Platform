#!/usr/bin/env python3
"""TTG Layout JSON Migration — adds missing fields without overwriting user data."""
import json
import sys
import os
from pathlib import Path

REQUIRED_TOP_KEYS = ["defaults", "overrides", "lastModified", "backDefaults", "backOverrides"]
REQUIRED_ELEMENTS = ["collection", "badge", "number", "name", "rarity", "creature"]
REQUIRED_BACK_ELEMENTS = ["centerIcon", "topLabel", "bottomLabel", "cornerBadge", "numberBadge"]
REQUIRED_FRANCHISES = ["minimon", "cybermon", "dracobell"]

ELEMENT_DEFAULTS = {
    "collection": {"x": 0, "y": -300, "scale": 1},
    "badge": {"x": 290, "y": 0, "scale": 1},
    "number": {"x": -290, "y": 0, "scale": 1},
    "name": {"x": 0, "y": 300, "scale": 1},
    "rarity": {"x": 0, "y": -250, "scale": 1},
    "creature": {"x": 0, "y": 0, "scale": 1},
}

BACK_DEFAULTS = {
    "minimon": {
        "centerIcon": {"x": 0, "y": 0, "scale": 1},
        "topLabel": {"x": 0, "y": -280, "scale": 1},
        "bottomLabel": {"x": 0, "y": 280, "scale": 1},
        "cornerBadge": {"x": 280, "y": -280, "scale": 1},
        "numberBadge": {"x": -280, "y": -280, "scale": 1},
    },
    "cybermon": {
        "centerIcon": {"x": 0, "y": 0, "scale": 1},
        "topLabel": {"x": 0, "y": -280, "scale": 1},
        "bottomLabel": {"x": 0, "y": 280, "scale": 1},
        "cornerBadge": {"x": 280, "y": -280, "scale": 1},
        "numberBadge": {"x": -280, "y": -280, "scale": 1},
    },
    "dracobell": {
        "centerIcon": {"x": 0, "y": 0, "scale": 1},
        "topLabel": {"x": 0, "y": -280, "scale": 1},
        "bottomLabel": {"x": 0, "y": 280, "scale": 1},
        "cornerBadge": {"x": 280, "y": -280, "scale": 1},
        "numberBadge": {"x": -280, "y": -280, "scale": 1},
    },
}


def migrate(path: str, dry_run: bool = False):
    with open(path, "r") as f:
        data = json.load(f)

    original = json.dumps(data, indent=2)
    changed = False

    # Ensure top-level keys
    for key in REQUIRED_TOP_KEYS:
        if key not in data:
            data[key] = {} if key not in ["lastModified"] else 0
            print(f"  + Added missing top key: {key}")
            changed = True

    # Ensure franchise entries in defaults
    for franchise in REQUIRED_FRANCHISES:
        if franchise not in data["defaults"]:
            data["defaults"][franchise] = {}
            changed = True
        for elem in REQUIRED_ELEMENTS:
            if elem not in data["defaults"][franchise]:
                data["defaults"][franchise][elem] = dict(ELEMENT_DEFAULTS[elem])
                print(f"  + Added missing element: defaults.{franchise}.{elem}")
                changed = True

    # Ensure backDefaults
    for franchise in REQUIRED_FRANCHISES:
        if franchise not in data["backDefaults"]:
            data["backDefaults"][franchise] = {}
            changed = True
        for elem in REQUIRED_BACK_ELEMENTS:
            if elem not in data["backDefaults"].get(franchise, {}):
                if franchise not in data["backDefaults"]:
                    data["backDefaults"][franchise] = {}
                data["backDefaults"][franchise][elem] = dict(BACK_DEFAULTS[franchise][elem])
                print(f"  + Added missing back element: backDefaults.{franchise}.{elem}")
                changed = True

    # Ensure backOverrides exists
    if "backOverrides" not in data:
        data["backOverrides"] = {}
        changed = True

    if not changed:
        print("  ✅ Layout JSON is up to date — no migration needed")
        return

    if dry_run:
        print("  (dry run — no changes written)")
        return

    # Update lastModified
    import time
    data["lastModified"] = int(time.time() * 1000)

    with open(path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"  ✅ Migrated: {path}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", default="prisma/tazo-layouts.json")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    migrate(args.path, args.dry_run)
