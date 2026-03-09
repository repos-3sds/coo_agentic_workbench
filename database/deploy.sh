#!/usr/bin/env bash
#
# deploy.sh -- NPA Workbench Database Deployment Script
#
# Imports npa_workbench_full_export.sql into a MariaDB/MySQL instance,
# verifies table counts and row counts, and reports results.
#
# Usage:
#   ./deploy.sh [OPTIONS]
#
# Options:
#   --host       Database host         (default: localhost)
#   --port       Database port         (default: 3306)
#   --user       Database user         (default: npa_user)
#   --password   Database password     (default: npa_password)
#   --database   Database name         (default: npa_workbench)
#   --sql-file   SQL dump file path    (default: npa_workbench_full_export.sql)
#   --skip-migrations  Skip applying database/migrations/*.sql (default: apply)
#   --apply-demo-seeds Apply optional demo seeds (NPA drafts 001-005)
#   --help       Show this help message
#

set -euo pipefail

# ──────────────────────────────────────────────
# Color helpers
# ──────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }

# ──────────────────────────────────────────────
# Defaults
# ──────────────────────────────────────────────
HOST="localhost"
PORT="3306"
USER="npa_user"
PASSWORD="npa_password"
DATABASE="npa_workbench"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/npa_workbench_full_export.sql"

EXPECTED_TABLE_COUNT=42
APPLY_MIGRATIONS=true
APPLY_DEMO_SEEDS=false

# ──────────────────────────────────────────────
# Usage
# ──────────────────────────────────────────────
usage() {
    cat <<EOF
${BOLD}NPA Workbench Database Deployment${NC}

${BOLD}Usage:${NC}
  $(basename "$0") [OPTIONS]

${BOLD}Options:${NC}
  --host       Database host         (default: ${HOST})
  --port       Database port         (default: ${PORT})
  --user       Database user         (default: ${USER})
  --password   Database password     (default: ${PASSWORD})
  --database   Database name         (default: ${DATABASE})
  --sql-file   SQL dump file path    (default: npa_workbench_full_export.sql)
  --skip-migrations  Skip applying database/migrations/*.sql (default: apply)
  --apply-demo-seeds Apply optional demo seeds (NPA drafts 001-005)
  --help       Show this help message

${BOLD}Examples:${NC}
  # Deploy with defaults
  ./deploy.sh

  # Deploy to a remote host
  ./deploy.sh --host db.example.com --port 3307 --user admin --password s3cret

  # Deploy a specific SQL file
  ./deploy.sh --sql-file /path/to/backup.sql

EOF
    exit 0
}

# ──────────────────────────────────────────────
# Parse arguments
# ──────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "$1" in
        --host)      HOST="$2";     shift 2 ;;
        --port)      PORT="$2";     shift 2 ;;
        --user)      USER="$2";     shift 2 ;;
        --password)  PASSWORD="$2"; shift 2 ;;
        --database)  DATABASE="$2"; shift 2 ;;
        --sql-file)  SQL_FILE="$2"; shift 2 ;;
        --skip-migrations) APPLY_MIGRATIONS=false; shift 1 ;;
        --apply-demo-seeds) APPLY_DEMO_SEEDS=true; shift 1 ;;
        --help|-h)   usage ;;
        *)
            error "Unknown option: $1"
            echo "Run '$(basename "$0") --help' for usage."
            exit 1
            ;;
    esac
done

# ──────────────────────────────────────────────
# Validation
# ──────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}  NPA Workbench Database Deployment${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo ""

# Check mysql client
if ! command -v mysql &>/dev/null; then
    error "mysql client not found. Please install MariaDB or MySQL client."
    echo ""
    echo "  macOS:   brew install mariadb"
    echo "  Ubuntu:  sudo apt-get install mariadb-client"
    echo "  RHEL:    sudo yum install mariadb"
    echo ""
    exit 1
fi
success "mysql client found: $(mysql --version 2>&1 | head -1)"

# Check SQL file
if [[ ! -f "$SQL_FILE" ]]; then
    error "SQL file not found: ${SQL_FILE}"
    exit 1
fi

FILE_SIZE=$(du -h "$SQL_FILE" | cut -f1)
success "SQL file found: ${SQL_FILE} (${FILE_SIZE})"

# ──────────────────────────────────────────────
# MySQL connection helper
# ──────────────────────────────────────────────
MYSQL_CMD="mysql -h${HOST} -P${PORT} -u${USER} -p${PASSWORD}"
MYSQL_CMD_DB="${MYSQL_CMD} ${DATABASE}"

# Test connection (without database)
info "Testing connection to ${HOST}:${PORT} as ${USER}..."
if ! ${MYSQL_CMD} -e "SELECT 1;" &>/dev/null; then
    error "Cannot connect to MariaDB at ${HOST}:${PORT} as ${USER}."
    error "Check your credentials and that the server is running."
    exit 1
fi
success "Connected to MariaDB at ${HOST}:${PORT}"

# ──────────────────────────────────────────────
# Create database
# ──────────────────────────────────────────────
info "Creating database '${DATABASE}' if it does not exist..."
${MYSQL_CMD} -e "CREATE DATABASE IF NOT EXISTS \`${DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
success "Database '${DATABASE}' is ready"

# ──────────────────────────────────────────────
# Import
# ──────────────────────────────────────────────
info "Importing ${SQL_FILE} into '${DATABASE}'..."
echo -e "     This may take a moment..."
echo ""

START_TIME=$(date +%s)

if ${MYSQL_CMD_DB} < "$SQL_FILE"; then
    END_TIME=$(date +%s)
    ELAPSED=$((END_TIME - START_TIME))
    success "Import completed in ${ELAPSED} seconds"
else
    error "Import failed. Check the SQL file and database permissions."
    exit 1
fi

# ──────────────────────────────────────────────
# Apply migrations
# ──────────────────────────────────────────────
if [[ "${APPLY_MIGRATIONS}" == "true" ]]; then
    MIGRATIONS_DIR="${SCRIPT_DIR}/migrations"
    echo ""
    info "Applying migrations from ${MIGRATIONS_DIR}..."

    if [[ ! -d "${MIGRATIONS_DIR}" ]]; then
        warn "Migrations directory not found; skipping"
    else
        shopt -s nullglob
        MIGRATION_FILES=("${MIGRATIONS_DIR}"/*.sql)
        shopt -u nullglob

        if (( ${#MIGRATION_FILES[@]} == 0 )); then
            warn "No migration files found; skipping"
        else
            for f in "${MIGRATION_FILES[@]}"; do
                info "Applying $(basename "$f")..."
                ${MYSQL_CMD_DB} < "$f"
                success "Applied $(basename "$f")"
            done
        fi
    fi
fi

# ──────────────────────────────────────────────
# Optional demo seeds
# ──────────────────────────────────────────────
if [[ "${APPLY_DEMO_SEEDS}" == "true" ]]; then
    echo ""
    info "Applying optional demo seeds (NPA drafts 001-005)..."

    SEED_SCRIPT="${SCRIPT_DIR}/apply-demo-seeds.sh"
    if [[ ! -f "${SEED_SCRIPT}" ]]; then
        error "Seed script not found: ${SEED_SCRIPT}"
        exit 1
    fi

    bash "${SEED_SCRIPT}" --host "${HOST}" --port "${PORT}" --user "${USER}" --password "${PASSWORD}" --database "${DATABASE}"
    success "Optional demo seeds applied"
fi

# ──────────────────────────────────────────────
# Verify table count
# ──────────────────────────────────────────────
echo ""
info "Verifying deployment..."

ACTUAL_TABLE_COUNT=$(${MYSQL_CMD_DB} -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DATABASE}' AND table_type='BASE TABLE';")

if [[ "${ACTUAL_TABLE_COUNT}" -eq "${EXPECTED_TABLE_COUNT}" ]]; then
    success "Table count: ${ACTUAL_TABLE_COUNT} / ${EXPECTED_TABLE_COUNT} (PASS)"
else
    warn "Table count: ${ACTUAL_TABLE_COUNT} / ${EXPECTED_TABLE_COUNT} (MISMATCH)"
fi

# ──────────────────────────────────────────────
# Row counts per table
# ──────────────────────────────────────────────
echo ""
echo -e "${BOLD}Table Row Counts:${NC}"
echo -e "${BOLD}──────────────────────────────────────────────${NC}"
printf "  ${BOLD}%-45s %s${NC}\n" "TABLE" "ROWS"
echo -e "  ──────────────────────────────────────────────"

TOTAL_ROWS=0
while IFS=$'\t' read -r tbl cnt; do
    printf "  %-45s %s\n" "${tbl}" "${cnt}"
    TOTAL_ROWS=$((TOTAL_ROWS + cnt))
done < <(${MYSQL_CMD_DB} -N -e "
    SELECT table_name, table_rows
    FROM information_schema.tables
    WHERE table_schema='${DATABASE}' AND table_type='BASE TABLE'
    ORDER BY table_name;
")

echo -e "  ──────────────────────────────────────────────"
printf "  ${BOLD}%-45s %s${NC}\n" "TOTAL" "${TOTAL_ROWS}"

# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  Deployment Complete${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════${NC}"
echo ""
echo "  Host:     ${HOST}:${PORT}"
echo "  Database: ${DATABASE}"
echo "  User:     ${USER}"
echo "  Tables:   ${ACTUAL_TABLE_COUNT}"
echo "  Rows:     ~${TOTAL_ROWS}"
echo ""
echo "  Connection string:"
echo "    mysql -h${HOST} -P${PORT} -u${USER} -p${PASSWORD} ${DATABASE}"
echo ""
