#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PDF_DIR="$ROOT_DIR/Context/KB Official PDFs/pdfs"

if [[ ! -d "$PDF_DIR" ]]; then
  echo "Missing folder: $PDF_DIR" >&2
  echo "Create it and place PDFs there, or run: bash scripts/download_official_pdfs_sg.sh" >&2
  exit 1
fi

echo "Importing PDFs from: $PDF_DIR"
node "$ROOT_DIR/server/import-kb-pdfs.js" "$PDF_DIR" "UNIVERSAL"
