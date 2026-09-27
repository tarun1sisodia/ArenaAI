#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "=> Running database migrations via dist/db/migrate.js..."
  node dist/db/migrate.js || {
    echo "=> FATAL: Database migration failed! Aborting container startup."
    exit 1
  }
  echo "=> Migrations applied successfully."
fi

exec "$@"
