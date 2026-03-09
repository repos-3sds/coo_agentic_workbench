# Official PDFs (Singapore) — Local Working Folder

This folder is intentionally structured as a **local working area**:
- Large binary files (PDF/XLSX) are **ignored by git**
- `manifest.tsv` is tracked so the team can fetch the same sources consistently

## What belongs here
- `manifest.tsv` — filename ↔ official URL mapping (tracked)
- `README.md` — this file (tracked)
- Downloaded PDFs/XLSX — **local only** (ignored)

## Typical workflow
1) Download the files listed in `manifest.tsv` into this folder.
2) Import them into the Knowledge Base DB table (metadata + file_path) using the repo scripts.

## Notes
- Keep documents scoped to **Singapore** regulatory/policy sources (MAS, PDPC, BIS/BCBS, etc.).
- Do not commit copyrighted PDFs into git.

