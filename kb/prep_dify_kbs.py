#!/usr/bin/env python3
"""
Dify KB Preparation Script
This script validates the JSON sources in the 'kb' directory and prints instructions
for uploading them into Dify as Datasets.
"""

import os
import json

KB_DIR = "c:/Users/vssvi/Downloads/DCE Agent/kb"

KBS = [
    "SA1_KB1_Document_Taxonomy.json",
    "SA1_KB9_SLA_Policy.json",
    "SA2_KB1_Document_Taxonomy.json",
    "SA2_KB2_Checklist_Rules.json",
    "SA2_KB3_KB12_GTA_Reference.json",
    "SA2_KB10_Exception_Playbook.json"
]


def main():
    print("=== Dify SA-1 / SA-2 Knowledge Base Prep ===\n")
    if not os.path.exists(KB_DIR):
        print(f"Error: Directory {KB_DIR} not found.")
        return

    for kb_file in KBS:
        path = os.path.join(KB_DIR, kb_file)
        if not os.path.exists(path):
            print(f"MISSING {kb_file}")
            continue
        try:
            with open(path, "r", encoding="utf-8-sig") as f:
                data = json.load(f)
                print(f"Validated {kb_file} ({len(data)} records)")
        except Exception as e:
            print(f"ERROR {kb_file}: {e}")

    print("\n=== Dify Import Instructions ===")
    print("1. Create one dataset per JSON file.")
    print("2. Use High Quality indexing and text-embedding-3-large.")
    print("3. SA-1 KB-1 and SA-2 KB-1/KB-2: chunk 500, overlap 50.")
    print("4. SA-1 KB-9 and SA-2 KB-3/KB-10: chunk 300, overlap 30.")
    print("5. Retrieval threshold 0.75 with TopK tuned per workflow node.")


if __name__ == "__main__":
    main()
