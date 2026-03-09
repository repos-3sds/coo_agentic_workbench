#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/Context/KB Official PDFs/pdfs"
MANIFEST="$ROOT_DIR/Context/KB Official PDFs/manifest.tsv"

mkdir -p "$OUT_DIR"

if [[ ! -f "$MANIFEST" ]]; then
  echo "Missing manifest: $MANIFEST" >&2
  exit 1
fi

download_one() {
  local url="$1"
  local out="$2"

  if [[ -f "$out" ]]; then
    echo "OK  (exists)  $(basename "$out")"
    return 0
  fi

  echo "GET $url"
  # Some gov sites block default curl UA; use a common UA and follow redirects.
  # Keep failures non-fatal so you still get the rest of the PDFs.
  if ! curl -fL --retry 3 --retry-delay 2 \
    -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" \
    -o "$out" "$url"; then
    echo "WARN: download failed: $url" >&2
    rm -f "$out" || true
    return 1
  fi

  # Basic sanity check: avoid saving HTML error pages as .pdf
  if file "$out" | grep -Eqi "html|text"; then
    echo "WARN: downloaded non-PDF content for $(basename "$out") (likely blocked). Keeping file removed." >&2
    rm -f "$out" || true
    return 1
  fi

  echo "OK  (saved)   $(basename "$out")"
}

failures=0

while IFS=$'\t' read -r filename url; do
  [[ -z "${filename// }" ]] && continue
  [[ "$filename" =~ ^# ]] && continue
  out="$OUT_DIR/$filename"
  if ! download_one "$url" "$out"; then
    failures=$((failures+1))
  fi
done < "$MANIFEST"

echo
echo "Done. Output folder: $OUT_DIR"
if [[ "$failures" -gt 0 ]]; then
  echo "Completed with $failures download failure(s). See warnings above." >&2
  exit 2
fi
