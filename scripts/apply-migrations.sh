#!/bin/bash
# apply-migrations.sh
# Jalankan di CT 102: bash /tmp/apply-migrations.sh

set -e

MIGRATION_DIR="/tmp/epropam-migrations"
CONTAINER="supabase-db"
PG_USER="postgres"
PG_DB="postgres"

echo "=== E-PROPAM: Apply Schema Migrations ==="
echo "Container: $CONTAINER"
echo ""

# Apply setiap file SQL secara urut
for f in $(ls $MIGRATION_DIR/*.sql | sort); do
  echo "▶ Applying: $(basename $f)..."
  docker exec -i $CONTAINER psql -U $PG_USER -d $PG_DB < "$f"
  echo "  ✅ Done"
done

echo ""
echo "=== Semua migrasi selesai! ==="
