#!/usr/bin/env bash
#
# apply-demo-seeds.sh -- Optional demo seed runner (NPA drafts 001-005)
#
# Applies the seed-npa-00x-*.sql files after the base DB + migrations are deployed.
#
# Usage:
#   ./apply-demo-seeds.sh [OPTIONS]
#
# Options:
#   --host       Database host         (default: localhost)
#   --port       Database port         (default: 3306)
#   --user       Database user         (default: npa_user)
#   --password   Database password     (default: npa_password)
#   --database   Database name         (default: npa_workbench)
#   --ssl        Enable SSL
#   --skip-ssl-verify-server-cert  Disable SSL server cert verification (useful for managed DB proxies)
#   --help       Show this help message
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

HOST="localhost"
PORT="3306"
USER="npa_user"
PASSWORD="npa_password"
DATABASE="npa_workbench"

MYSQL_SSL_ARGS=()

usage() {
  cat <<EOF
Optional Demo Seeds Runner

Usage:
  $(basename "$0") [OPTIONS]

Options:
  --host       Database host         (default: ${HOST})
  --port       Database port         (default: ${PORT})
  --user       Database user         (default: ${USER})
  --password   Database password     (default: ${PASSWORD})
  --database   Database name         (default: ${DATABASE})
  --ssl        Enable SSL
  --skip-ssl-verify-server-cert  Disable SSL server cert verification (managed DB proxies)
  --help       Show this help message

EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) HOST="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --user) USER="$2"; shift 2 ;;
    --password) PASSWORD="$2"; shift 2 ;;
    --database) DATABASE="$2"; shift 2 ;;
    --ssl) MYSQL_SSL_ARGS+=("--ssl"); shift 1 ;;
    --skip-ssl-verify-server-cert) MYSQL_SSL_ARGS+=("--skip-ssl-verify-server-cert"); shift 1 ;;
    --help|-h) usage ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Run '$(basename "$0") --help' for usage." >&2
      exit 1
      ;;
  esac
done

SEED_FILES=(
  "${SCRIPT_DIR}/seed-npa-001-digital-asset-custody.sql"
  "${SCRIPT_DIR}/seed-npa-002-fx-put-option.sql"
  "${SCRIPT_DIR}/seed-npa-003-green-bond-etf.sql"
  "${SCRIPT_DIR}/seed-npa-004-capital-protected-note.sql"
  "${SCRIPT_DIR}/seed-npa-005-supply-chain-finance.sql"
)

for f in "${SEED_FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "[ERROR] Missing seed file: $f" >&2
    exit 1
  fi
done

MYSQL_BASE=(mysql "${MYSQL_SSL_ARGS[@]}" -h"${HOST}" -P"${PORT}" -u"${USER}" "${DATABASE}")

echo "[INFO] Applying optional demo seeds to ${HOST}:${PORT}/${DATABASE} ..."

# Avoid echoing password in process list; mysql reads MYSQL_PWD if set.
MYSQL_PWD="${PASSWORD}" \
  "${MYSQL_BASE[@]}" -e "SELECT 1;" >/dev/null

for f in "${SEED_FILES[@]}"; do
  echo "[INFO] Applying $(basename "$f")..."
  MYSQL_PWD="${PASSWORD}" "${MYSQL_BASE[@]}" < "$f"
  echo "[OK]   Applied $(basename "$f")"
done

echo "[OK] Demo seeds applied."
